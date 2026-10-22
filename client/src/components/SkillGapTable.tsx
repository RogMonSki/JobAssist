import type { SkillGap } from '../types'

interface SkillGapTableProps {
  gap: SkillGap
}

function plural(count: number): string {
  return count === 1 ? '1 application' : `${count} applications`
}

function SkillGapTable({ gap }: SkillGapTableProps) {
  if (gap.tier === 'none') {
    return (
      <p className="text-sm text-slate-600">
        No job descriptions have been analysed yet. Add job descriptions to your applications on the dashboard and
        this table will show which skills employers ask for that your CV is missing.
      </p>
    )
  }

  return (
    <div>
      <p className="text-sm text-slate-600">
        Based on {plural(gap.applicationCount)}
        {gap.tier === 'limited' && ' — a small sample, so treat it as indicative'}.
      </p>

      {gap.skills.length === 0 ? (
        <p className="mt-2 text-sm text-slate-600">No skills were found in those job descriptions.</p>
      ) : (
        <div className="mt-3 max-h-80 overflow-y-auto rounded-lg border border-slate-200">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="sticky top-0 bg-slate-50">
              <tr className="border-b border-slate-200 text-slate-600">
                <th className="px-3 py-2 font-medium">Skill</th>
                <th className="px-3 py-2 font-medium">Asked for in</th>
                <th className="px-3 py-2 font-medium">Required in</th>
                <th className="px-3 py-2 font-medium">In your CV</th>
              </tr>
            </thead>
            <tbody>
              {gap.skills.map((skill) => (
                <tr key={skill.name} className="border-b border-slate-100 last:border-0">
                  <td className="px-3 py-2 font-medium text-slate-900">{skill.name}</td>
                  <td className="px-3 py-2 text-slate-700">
                    {skill.applicationCount} of {gap.applicationCount}
                  </td>
                  <td className="px-3 py-2 text-slate-700">
                    {skill.requiredCount} of {gap.applicationCount}
                  </td>
                  <td className={`px-3 py-2 font-medium ${skill.inCv ? 'text-teal-700' : 'text-red-700'}`}>
                    {skill.inCv ? '✓ Yes' : '✗ No'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default SkillGapTable
