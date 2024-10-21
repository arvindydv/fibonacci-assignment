export interface Heading {
  type: "h1" | "h2" | "h3"
  title: string
  subheadings?: Heading[]
}

export const parseDocument = (text: string): Heading[] => {
  const lines = text.split("\n")
  const structure: Heading[] = []
  let currentH1: Heading | undefined
  let currentH2: Heading | undefined

  lines.forEach((line) => {
    if (line.startsWith("###")) {
      currentH2?.subheadings?.push({
        type: "h3",
        title: line.replace("###", "").trim(),
      })
    } else if (line.startsWith("##")) {
      currentH2 = {
        type: "h2",
        title: line.replace("##", "").trim(),
        subheadings: [],
      }
      currentH1?.subheadings?.push(currentH2)
    } else if (line.startsWith("#")) {
      currentH1 = {
        type: "h1",
        title: line.replace("#", "").trim(),
        subheadings: [],
      }
      structure.push(currentH1)
    }
  })

  return structure
}
