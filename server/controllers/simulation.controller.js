// This catalog describes the simulator's supported parts and slots.
export const parts = {
  case: { 'case-atx': { formats: ['atx', 'matx'] }, 'case-matx': { formats: ['matx'] } },
  motherboard: {
    'board-am5': { socket: 'am5', memory: 'ddr5', format: 'atx' },
    'board-am4': { socket: 'am4', memory: 'ddr4', format: 'matx' },
  },
  cpu: { 'cpu-am5': { socket: 'am5' }, 'cpu-am4': { socket: 'am4' } },
  memory: { 'ram-ddr5': { type: 'ddr5' }, 'ram-ddr4': { type: 'ddr4' } },
};

export function compatibility({ parts: placed }) {
  const build = Object.fromEntries(placed.map(({ slot, part_id }) => [slot, parts[slot][part_id]]));
  const { motherboard, cpu, memory, case: pcCase } = build;
  const issues = [];
  const missing = Object.keys(parts).filter(slot => !build[slot]);
  if (motherboard && cpu && motherboard.socket !== cpu.socket) issues.push('CPU_SOCKET_MISMATCH');
  if (motherboard && memory && motherboard.memory !== memory.type) issues.push('MEMORY_TYPE_MISMATCH');
  if (motherboard && pcCase && !pcCase.formats.includes(motherboard.format)) issues.push('BOARD_CASE_MISMATCH');
  return {
    status: issues.length ? 'incompatible' : missing.length ? 'incomplete' : 'compatible',
    report: { issues, missing },
  };
}
