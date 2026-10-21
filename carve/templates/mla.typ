// template: MLA-format essay (main.typ that includes body.typ)
#import "@local/manuscript:0.20.0" as manuscript: *

#show: mla.with(
  title: "⟨1:The Title⟩",
  instructor: "⟨2:Professor Doe⟩",
  course: "⟨3:ENG 101⟩",
  date: datetime(year: ⟨YEAR⟩, month: ⟨MONTH⟩, day: ⟨DAY⟩),
)
#include "⟨4:body.typ⟩"
⟨0⟩
