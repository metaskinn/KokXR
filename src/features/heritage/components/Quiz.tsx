import { useRef, useState } from 'react'
import type { Question, Source } from '../../../domain/artifact'
import SourceLine from '../../../shared/ui/SourceLine'
import UiIcon from '../../../shared/ui/UiIcon'

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F']
/** Accusative possessive suffix after a numeral read aloud in Turkish ("2'sini", "3'ünü"). */
const SUFFIX = ['ını', 'ini', 'sini', 'ünü', 'ünü', 'ini', 'sını', 'sini', 'ini', 'unu', 'unu']

/** An answer is the chosen option index, or 'shown' when the answer was revealed without choosing (classroom use; not scored). */
type Answer = number | 'shown'

/**
 * One question at a time. Choosing an option locks the answer (no submit button); "Cevabı göster" reveals it for a class to discuss.
 * Correct and chosen options are marked with an icon and text, never colour alone. Answers are not stored.
 */
export default function Quiz({ name, questions, sources }: { name: string; questions: Question[]; sources: Source[] }) {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<(Answer | undefined)[]>([])
  const [pending, setPending] = useState<number | null>(null)
  const arrowAt = useRef(0)
  const stepRef = useRef<HTMLParagraphElement>(null)
  const explainRef = useRef<HTMLDivElement>(null)
  const total = questions.length
  if (!total) return null

  function go(next: number) {
    setStep(next)
    setPending(null)
    // Move focus to the new question (or the result) so a screen reader reads it next.
    requestAnimationFrame(() => stepRef.current?.focus())
  }
  function lock(answer: Answer) {
    setAnswers((old) => { const copy = [...old]; copy[step] = answer; return copy })
    setPending(null)
    requestAnimationFrame(() => explainRef.current?.focus())
  }

  if (step >= total) {
    const right = questions.filter((q, i) => answers[i] === q.correct).length
    const shown = answers.filter((a) => a === 'shown').length
    return <div className="quiz">
      <p className="quiz-step" ref={stepRef} tabIndex={-1}>Sonuç</p>
      <p className="quiz-result">{total} sorudan {right}'{SUFFIX[right] ?? 'ini'} doğru cevapladın.</p>
      {shown > 0 && <p className="quiz-note">Cevabını gösterdiğin {shown} soru sayılmadı.</p>}
      <div className="quiz-nav"><button type="button" onClick={() => { setAnswers([]); go(0) }}>Soruları baştan çöz</button></div>
    </div>
  }

  const q = questions[step]
  const answer = answers[step]
  const locked = answer !== undefined
  const field = `${name}-q${step}`
  return <div className="quiz">
    <p className="quiz-step" ref={stepRef} tabIndex={-1}>Soru {step + 1} / {total}</p>
    <fieldset>
      <legend>{q.question}</legend>
      <ul className="quiz-options">
        {q.options.map((option, i) => {
          const state = !locked ? undefined : i === q.correct ? 'correct' : i === answer ? 'wrong' : undefined
          return <li key={i}><label className="quiz-option" data-state={state} data-locked={locked ? '' : undefined}>
            <input type="radio" name={field} value={i} disabled={locked}
              checked={locked ? answer === i : pending === i}
              onKeyDown={(e) => {
                if (e.key.startsWith('Arrow')) arrowAt.current = e.timeStamp
                // Arrow keys only move between options; Space or Enter on the focused option answers.
                if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); lock(i) }
              }}
              onChange={(e) => {
                if (e.timeStamp - arrowAt.current < 150) setPending(i)
                else lock(i)
              }} />
            <span className="quiz-letter" aria-hidden="true">{LETTERS[i] ?? i + 1}</span>
            <span>{option}</span>
            {state === 'correct' && <span className="quiz-verdict"><UiIcon name="check" />Doğru cevap</span>}
            {state === 'wrong' && <span className="quiz-verdict"><UiIcon name="x" />Senin cevabın</span>}
          </label></li>
        })}
      </ul>
    </fieldset>
    {locked && <div className="quiz-explain" ref={explainRef} tabIndex={-1}>
      <p className="sr-only">{answer === 'shown' ? `Doğru cevap ${LETTERS[q.correct]} şıkkı.` : answer === q.correct ? 'Cevabın doğru.' : `Cevabın yanlış. Doğru cevap ${LETTERS[q.correct]} şıkkı.`}</p>
      <p>{q.description}</p>
      <SourceLine sources={sources} sourceId={q.sourceId} />
    </div>}
    <div className="quiz-nav">
      {step > 0 ? <button type="button" className="btn-ghost" onClick={() => go(step - 1)}><UiIcon name="back" />Önceki soru</button> : <span />}
      {!locked && <button type="button" className="btn-ghost" onClick={() => lock('shown')}>Cevabı göster</button>}
      {locked && <button type="button" onClick={() => go(step + 1)}>{step + 1 < total ? 'Sonraki soru' : 'Sonucu gör'}<UiIcon name="next" /></button>}
    </div>
  </div>
}
