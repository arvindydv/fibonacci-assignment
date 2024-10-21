import { FC, useEffect, useRef, useState } from "react"
import { Accordion, AccordionSummary, AccordionDetails } from "@mui/material"
import ExpandMoreIcon from "@mui/icons-material/ExpandMore"
import { useDrag, useDrop } from "react-dnd"
import { Heading } from "../utils/parseDocument"

interface DraggableHeading extends Heading {
  parent?: string | null // To keep track of the parent heading for nested structures
}

// Define drag item types
const ITEM_TYPE = "HEADING"

export const StructureAccordion: FC<{ structure: Heading[] }> = ({
  structure,
}) => {
  const [headings, setHeadings] = useState<DraggableHeading[]>([])
  const [expanded, setExpanded] = useState<string[]>([]) // Track expanded accordions

  useEffect(() => {
    const convertToDraggable = (structure: Heading[]): DraggableHeading[] => {
      return structure.map((heading) => {
        return {
          ...heading,
          parent: null,
          subheadings: heading.subheadings
            ? convertToDraggable(heading.subheadings)
            : undefined,
        }
      })
    }

    setHeadings(convertToDraggable(structure))
  }, [structure])

  // Helper function to move an item within the structure
  const moveHeading = (
    draggedItem: DraggableHeading,
    targetItem: DraggableHeading
  ) => {
    const findAndRemove = (
      arr: DraggableHeading[],
      item: DraggableHeading
    ): DraggableHeading[] => {
      return arr.reduce((acc: DraggableHeading[], curr: DraggableHeading) => {
        if (curr.title === item.title) return acc
        if (curr.subheadings) {
          return [
            ...acc,
            {
              ...curr,
              subheadings: findAndRemove(
                curr.subheadings as DraggableHeading[],
                item
              ),
            },
          ]
        }
        return [...acc, curr]
      }, [])
    }

    const insertAtPosition = (
      arr: DraggableHeading[],
      item: DraggableHeading,
      target: DraggableHeading
    ): DraggableHeading[] => {
      return arr.map((curr: DraggableHeading) => {
        if (curr.title === target.title) {
          return {
            ...curr,
            subheadings: [...(curr.subheadings || []), item],
          }
        }
        if (curr.subheadings) {
          return {
            ...curr,
            subheadings: insertAtPosition(
              curr.subheadings as DraggableHeading[],
              item,
              target
            ),
          }
        }
        return curr
      })
    }

    // Check if draggedItem can be dropped into targetItem
    if (targetItem.type === draggedItem.type) {
      return // Prevent H1 from being dropped into another H1
    }

    // Remove dragged item and insert it at the target position
    const updatedStructure = insertAtPosition(
      findAndRemove(headings, draggedItem),
      draggedItem,
      targetItem
    )
    setHeadings(updatedStructure)
  }

  // Draggable and Droppable Heading component
  const DraggableAccordion: FC<{
    heading: DraggableHeading
    level: number
    parent: DraggableHeading | null
  }> = ({ heading, level, parent }) => {
    const [{ isDragging }, drag] = useDrag({
      type: ITEM_TYPE,
      item: { ...heading, parent: parent?.title || null },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    })

    const [{ isOver }, drop] = useDrop({
      accept: ITEM_TYPE,
      drop: (draggedItem: DraggableHeading) =>
        moveHeading(draggedItem, heading),
      collect: (monitor) => ({
        isOver: monitor.isOver(),
      }),
      canDrop: (draggedItem: DraggableHeading) => {
        // Prevent H1 from being dropped into another H1
        const headingLevel = Number(heading.type.replace("h", ""))
        const draggedLevel = Number(draggedItem.type.replace("h", ""))
        if (draggedLevel !== headingLevel + 1) {
          return false
        }
        return true // Allow other drops
      },
    })

    const dragRef = useRef(null)
    const dropRef = useRef(null)

    drag(dragRef)
    drop(dropRef)

    // Handle accordion expansion
    const handleAccordionChange =
      (title: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
        setExpanded((prev) => {
          if (isExpanded) {
            return [...prev, title] // Expand
          } else {
            return prev.filter((t) => t !== title) // Collapse
          }
        })
      }

    return (
      <>
        {/* Empty drop target above accordion */}

        <Accordion
          ref={dropRef}
          sx={{
            opacity: isDragging ? 0.5 : 1,
            backgroundColor: isOver ? "lightblue" : "white",
          }}
          expanded={expanded.includes(heading.title)} // Control expansion based on state
          onChange={handleAccordionChange(heading.title)} // Handle changes
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />} ref={dragRef}>
            <h3>{heading.title}</h3>
          </AccordionSummary>
          <AccordionDetails>
            {heading.subheadings?.map((subheading, idx) => (
              <DraggableAccordion
                key={idx}
                heading={subheading}
                level={level + 1}
                parent={heading}
              />
            ))}
          </AccordionDetails>
        </Accordion>
      </>
    )
  }

  return (
    <>
      {headings.map((heading, index) => (
        <DraggableAccordion
          key={index}
          heading={heading}
          level={1}
          parent={null}
        />
      ))}
    </>
  )
}
