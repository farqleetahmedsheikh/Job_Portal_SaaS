import { ForbiddenException } from '@nestjs/common';
import { MessageType, NotifType } from '../../common/enums/enums';
import { Message } from './entities/message.entity';
import { MessagingService } from './messages.service';

function repo(overrides: Record<string, unknown> = {}) {
  return {
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    update: jest.fn(),
    create: jest.fn((value: unknown) => value),
    save: jest.fn((value: unknown): Promise<unknown> => Promise.resolve(value)),
    ...overrides,
  };
}

describe('MessagingService', () => {
  const convRepo = repo();
  const partRepo = repo();
  const msgRepo = repo();
  const manager = {
    create: jest.fn((_entity: unknown, value: unknown) => value),
    save: jest.fn((entity: unknown, value: Record<string, unknown>) => {
      if ((entity as { name?: string }).name === 'Conversation') {
        value.id = 'conv-1';
      }
      if ((entity as { name?: string }).name === 'Message') {
        return Promise.resolve({
          id: 'msg-1',
          createdAt: new Date(),
          ...value,
        });
      }
      return Promise.resolve(value);
    }),
    update: jest.fn(),
  };
  const ds = {
    query: jest.fn(),
    transaction: jest.fn((callback: (m: typeof manager) => Promise<unknown>) =>
      callback(manager),
    ),
  };
  const notifications = {
    notify: jest.fn(),
  };

  function service() {
    return new MessagingService(
      convRepo as never,
      partRepo as never,
      msgRepo as never,
      ds as never,
      notifications as never,
    );
  }

  beforeEach(() => {
    jest.clearAllMocks();
    convRepo.findOne.mockResolvedValue({ id: 'conv-1' });
    partRepo.findOneBy.mockResolvedValue({ conversationId: 'conv-1' });
  });

  it('rejects new conversations without an existing hiring relationship', async () => {
    ds.query.mockResolvedValueOnce([]);

    await expect(
      service().findOrCreate(
        'employer-1',
        { recipientId: 'candidate-1' },
        'employer',
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(ds.transaction).not.toHaveBeenCalled();
  });

  it('creates automation updates as system messages, not employer chat messages', async () => {
    ds.query
      .mockResolvedValueOnce([
        {
          application_id: 'app-1',
          job_id: 'job-1',
          applicant_id: 'candidate-1',
          company_id: 'company-1',
          employer_id: 'employer-1',
        },
      ])
      .mockResolvedValueOnce([]);

    await service().findOrCreate(
      'employer-1',
      {
        recipientId: 'candidate-1',
        jobId: 'job-1',
        firstMessage: 'Application status updated to Shortlisted.',
      },
      undefined,
      {
        system: true,
        messageType: MessageType.STATUS_UPDATE,
        metadata: { applicationId: 'app-1' },
      },
    );

    const messageSave = manager.save.mock.calls.find(
      ([entity]) => entity === Message,
    );

    expect(messageSave?.[1]).toMatchObject({
      conversationId: 'conv-1',
      senderId: null,
      type: MessageType.STATUS_UPDATE,
      text: 'Application status updated to Shortlisted.',
      metadata: { applicationId: 'app-1' },
    });
  });

  it('notifies the other participant for user-authored messages', async () => {
    const createdAt = new Date();
    const saved = {
      id: 'msg-1',
      conversationId: 'conv-1',
      senderId: 'employer-1',
      type: MessageType.USER,
      text: 'Can you share your availability?',
      createdAt,
    };
    msgRepo.create.mockImplementation((value: unknown) => value);
    msgRepo.save.mockResolvedValue(saved);
    msgRepo.findOne.mockResolvedValue(saved);
    partRepo.findOne.mockResolvedValue({
      userId: 'candidate-1',
      user: { email: 'candidate@example.com' },
    });
    ds.query.mockResolvedValueOnce([{ full_name: 'Hiring Manager' }]);

    await service().sendMessage('conv-1', 'employer-1', {
      text: 'Can you share your availability?',
    });

    expect(notifications.notify).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientId: 'candidate-1',
        recipientEmail: 'candidate@example.com',
        type: NotifType.MESSAGE,
        refId: 'msg-1',
        refType: 'message',
      }),
    );
  });
});
