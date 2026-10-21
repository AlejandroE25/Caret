// template: Lab report (from the vault's _Templates/lab-report.typ)
#import "@local/manuscript:0.20.0" as manuscript: *

#show: lab.with(
  course: "⟨1:PHYS 211⟩",
  number: ⟨2:1⟩,
  title: "⟨3:The Title of the Lab⟩",
  authors: ("Alejandro Escamilla", "Partner One", "Partner Two"),
  data: "https://docs.google.com/spreadsheets/d/...",  // link to the shared data sheet
  date: datetime(year: ⟨YEAR⟩, month: ⟨MONTH⟩, day: ⟨DAY⟩),
)

= Introduction

The purpose of this experiment is to #todo[state the goal].

= Methods

Procedure:
+ #todo[First step]
+ #todo[Second step]

#figure(
  rect(width: 60%, height: 2in)[#todo[photo of the setup or FBD: image("setup.png", width: 60%)]],
  caption: [The experimental setup.],
) <fig:setup>

= Results

#todo[IOLab graphs and the spreadsheet graph. Annotate at least one IOLab graph.]

// An IOLab or spreadsheet export, read from a CSV next to this file:
// #data-table(csv("run1.csv"), caption: [Run 1], limit: 20)

= Analysis

Formulas used:
$ F_"net" = sum F = m a $ <eq:newton>

#todo[Interpret the curves, citing @eq:newton and @fig:setup.]

= Discussion

Theoretical model (predictions): #todo[what the theory predicts, as equations]

Compare the results to the model, explain discrepancies, and justify decisions.
// e.g. a measured #qty("9.70", $m\/s^2$, err: "0.05") is #percent-error(9.70, 9.81) off from #qty("9.81", $m\/s^2$).

= Conclusion

#todo[Summarize findings.]

#contributions((
  "Alejandro Escamilla": todo[what they did],
  "Partner One": todo[what they did],
  "Partner Two": todo[what they did],
))
