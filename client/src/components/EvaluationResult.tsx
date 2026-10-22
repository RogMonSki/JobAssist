import type { CvEvaluation } from '../types'

interface EvaluationResultProps {
  evaluation: CvEvaluation
}

interface SectionProps {
  title: string
  items: string[]
}

function Section({ title, items }: SectionProps) {
  if (items.length === 0) {
    return null
  }
  return (
    <div>
      <h4 className="font-semibold text-slate-900">{title}</h4>
      <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-slate-700">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  )
}

function EvaluationResult({ evaluation }: EvaluationResultProps) {
  return (
    <div className="space-y-4">
      <p className="text-sm whitespace-pre-line text-slate-800">{evaluation.summary}</p>
      <Section title="Strengths" items={evaluation.strengths} />
      <Section title="Gaps" items={evaluation.gaps} />
      <Section title="Suggestions" items={evaluation.suggestions} />
    </div>
  )
}

export default EvaluationResult
