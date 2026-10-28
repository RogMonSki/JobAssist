interface ChartViewToggleProps {
  showTable: boolean
  onToggle: () => void
}

function ChartViewToggle({ showTable, onToggle }: ChartViewToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="rounded-lg border border-teal-600 px-3 py-1 text-sm font-semibold text-teal-700 hover:bg-teal-50"
    >
      {showTable ? 'View as chart' : 'View as table'}
    </button>
  )
}

export default ChartViewToggle
