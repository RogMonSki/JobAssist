import type { InterviewGuidance } from '../types'

interface PrepGuidanceProps {
  guidance: InterviewGuidance
}

interface BulletListProps {
  title: string
  items: string[]
}

function BulletList({ title, items }: BulletListProps) {
  if (items.length === 0) {
    return null
  }
  return (
    <div>
      <h5 className="text-sm font-semibold text-slate-900">{title}</h5>
      <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-slate-700">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  )
}

function PrepGuidance({ guidance }: PrepGuidanceProps) {
  return (
    <div className="space-y-5">
      <p className="text-sm whitespace-pre-line text-slate-800">{guidance.summary}</p>

      {!guidance.stagesFromJobDescription && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          The job description doesn't describe the interview stages, so this guidance is general.
        </p>
      )}

      {guidance.stages.map((stage, index) => (
        <section key={`${index}-${stage.name}`} className="space-y-3 rounded-lg border border-slate-200 p-4">
          <h4 className="font-semibold text-slate-900">{stage.name}</h4>
          <p className="text-sm text-slate-700">{stage.whatToExpect}</p>
          <BulletList title="How to prepare" items={stage.howToPrepare} />
          <BulletList title="Likely questions" items={stage.likelyQuestions} />
        </section>
      ))}

      {guidance.questionsToAsk.length > 0 && (
        <div>
          <h4 className="font-semibold text-slate-900">Questions to ask them</h4>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-slate-700">
            {guidance.questionsToAsk.map((question) => (
              <li key={question}>{question}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default PrepGuidance
