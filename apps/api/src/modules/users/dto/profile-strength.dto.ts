export interface ProfileStrengthItem {
  label: string;
  done: boolean;
  weight: number; // contribution to total %
}

export interface ProfileStrengthResponse {
  strength: number;
  checklist: ProfileStrengthItem[];
}
