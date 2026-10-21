// template: Article, a longer write-up with numbered sections
#import "@local/manuscript:0.20.0" as manuscript: *

#show: article.with(
  title: [⟨1:The Title⟩],
  course: "⟨2:CS 173⟩",
  date: datetime(year: ⟨YEAR⟩, month: ⟨MONTH⟩, day: ⟨DAY⟩),
)

= ⟨3:Introduction⟩
⟨0⟩
