// template: Book, a whole course's notes with cover and contents
#import "@local/manuscript:0.20.0" as manuscript: *

#show: book.with(
  title: [⟨1:The Title⟩],
  code: "⟨2:CS 173⟩",
  university: "University of Illinois Urbana-Champaign",
  date: datetime(year: ⟨YEAR⟩, month: ⟨MONTH⟩, day: ⟨DAY⟩),
)

= ⟨3:First Chapter⟩
⟨0⟩
