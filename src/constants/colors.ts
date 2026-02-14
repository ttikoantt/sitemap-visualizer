export const PATTERN_COLORS = [
  '#4A90D9', // blue
  '#50B83C', // green
  '#F49342', // orange
  '#9C6ADE', // purple
  '#47C1BF', // teal
  '#DE3618', // red
  '#EEC200', // yellow
  '#8C6B58', // brown
  '#5C6AC4', // indigo
  '#E06B8A', // pink
  '#00848E', // dark teal
  '#B98900', // dark yellow
] as const;

export const UNGROUPED_COLOR = '#E0E0E0';

export function getPatternColor(index: number): string {
  return PATTERN_COLORS[index % PATTERN_COLORS.length];
}
