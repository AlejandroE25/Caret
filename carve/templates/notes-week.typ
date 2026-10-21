// template: Week of notes, one #session per day
#import "@local/manuscript:0.20.0" as manuscript: *

#show: notes.with(
  course: "⟨1:CS 173⟩",
  week: ⟨2:1⟩,
  date: datetime(year: ⟨YEAR⟩, month: ⟨MONTH⟩, day: ⟨DAY⟩),
)

#session(datetime(year: ⟨YEAR⟩, month: ⟨MONTH⟩, day: ⟨DAY⟩), title: [⟨3:Topic⟩])

= ⟨4:Topic⟩
⟨0⟩
