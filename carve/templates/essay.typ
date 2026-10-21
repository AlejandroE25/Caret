// template: Essay in the house style (main.typ that includes body.typ)
#import "@local/manuscript:0.20.0" as manuscript: *

#show: essay.with(
  title: "⟨1:The Title⟩",
  course: "⟨2:RHET 105⟩",
  date: datetime(year: ⟨YEAR⟩, month: ⟨MONTH⟩, day: ⟨DAY⟩),
)
#include "⟨3:body.typ⟩"
⟨0⟩
