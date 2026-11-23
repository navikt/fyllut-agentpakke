# Discovery question bank

Pick the questions that matter for this change, and look up the facts first.
Phrase each question in plain language for developers, designers and
functional architects.

## Intent and scope

- Who is affected? Include distinct roles when their needs or permissions
  differ.
- What must they achieve, and what prevents it today?
- What is verified current behavior, and what is only reported or assumed?
- What outcome defines success?
- Is this a new capability, a correction, a replacement or a removal?
- What must stay unchanged?
- Are any terms vague, overloaded or different from the existing product
  language?

## Behavior and flow

- What starts the flow? Is there more than one entry point?
- What does the user see before acting, and what information do they need?
- Which actions can they take, in what order, and which are optional?
- What ends the flow successfully, and what happens next?
- Can the user pause, go back, edit, cancel or resume? What must be kept?
- Does an earlier answer, role, state or date change what is shown or allowed?
- What happens when an action is repeated, interrupted or done in another tab?
- Are there deadlines, expiry dates or time zones to consider?
- Which concrete example would expose a misunderstanding?

## Forms and answers

Use this section only when the change affects a form.

- Which answers are required, optional, conditionally required or read-only?
- Which example answers should and should not be accepted?
- Which labels, descriptions, help texts and error messages are needed?
- What happens to hidden, changed, removed or previously saved answers?
- What happens when a form is changed after people have saved or submitted
  answers?
- Are attachments, declarations, consent or personal data involved?
- What must the summary, receipt and confirmation show?
- Must calculated, repeated or prefilled values behave differently from
  values the user enters?
- If both the form builder and the published form are affected, what must
  match between building, preview, filling in, summary and submission?

## Receiving systems and integrations

Use this section only when the change affects what is sent, received or
stored.

- Who or what receives the result, and what must they get?
- Must existing receivers get the same result as before?
- What happens when a receiving system is unavailable or rejects the result?
  What does the user see, and what reaches the caseworker?
- Is it acceptable that a result is delayed, retried or delivered twice?
- Who must find out when something fails?

## Errors and boundaries

- What happens when information is missing, outdated or conflicting?
- What happens when saving, submitting, uploading or a lookup fails?
- Can the user retry safely, get help or continue later?
- Are eligibility rules, privacy, retention or audit needs involved beyond the
  repository defaults?
- Are other languages, content approval or legal requirements involved?
- Does the change depend on another team, a policy decision, content or a date?
- Which uncertainty needs research, user testing or another owner instead of
  another question?

## Slices

- Can the change be delivered in smaller parts that each work on their own?
- What do users see between two slices? Must a slice stay hidden until a later
  slice is ready?
- Which slices can different people work on at the same time?
- Which slice must be merged before another can start?
