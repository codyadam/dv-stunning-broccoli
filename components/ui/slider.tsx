import { Slider as SliderPrimitive } from "@base-ui/react/slider"

import { cn } from "@/lib/utils"

function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  fill = "start",
  marks,
  getThumbAriaLabel,
  getThumbAriaValueText,
  ...props
}: SliderPrimitive.Root.Props & {
  /** Which side of a single thumb is filled: from `min` up to it, or from it up to `max`. */
  fill?: "start" | "end"
  /** Values with a tick mark under the track. */
  marks?: readonly number[]
  getThumbAriaLabel?: SliderPrimitive.Thumb.Props["getAriaLabel"]
  getThumbAriaValueText?: SliderPrimitive.Thumb.Props["getAriaValueText"]
}) {
  const _values = Array.isArray(value)
    ? value
    : Array.isArray(defaultValue)
      ? defaultValue
      : [min, max]
  const low = Math.min(..._values)
  const high = Math.max(..._values)
  const [filledFrom, filledTo] =
    _values.length > 1 ? [low, high] : fill === "end" ? [low, max] : [min, high]

  return (
    <SliderPrimitive.Root
      className={cn("data-horizontal:w-full data-vertical:h-full data-disabled:cursor-not-allowed", className)}
      data-slot="slider"
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      thumbAlignment="edge"
      {...props}
    >
      <SliderPrimitive.Control className={cn(marks && "min-h-6", "group/slider relative flex w-full cursor-pointer touch-none items-center select-none data-disabled:pointer-events-none data-disabled:opacity-50 data-dragging:cursor-grabbing data-vertical:h-full data-vertical:min-h-40 data-vertical:w-auto data-vertical:flex-col")}>
        <SliderPrimitive.Track
          data-slot="slider-track"
          className={cn(
            "relative grow overflow-hidden rounded-md transition-colors duration-150 ease-out select-none data-horizontal:h-1 data-horizontal:w-full data-vertical:h-full data-vertical:w-1",
            // An end fill's empty side is the translucent indicator over the primary track;
            // darkening it on hover would blend it into the fill.
            fill === "end" ? "bg-primary" : "bg-muted group-hover/slider:bg-input"
          )}
        >
          <SliderPrimitive.Indicator
            data-slot="slider-range"
            className={cn(
              "select-none data-horizontal:h-full data-vertical:w-full",
              fill === "end" ? "bg-muted" : "bg-primary"
            )}
          />
        </SliderPrimitive.Track>
        {marks ? (
          // Inset by half a thumb: the thumb's centre stops that far from each end of the track.
          <div aria-hidden className="pointer-events-none absolute inset-x-1.5 top-1/2 mt-2">
            {marks.map((mark) => (
              <span
                key={mark}
                className={cn(
                  "absolute top-0 h-1.5 w-px -translate-x-1/2 transition-colors duration-150 ease-out",
                  mark >= filledFrom && mark <= filledTo ? "bg-primary" : "bg-muted-foreground/40",
                )}
                style={{ left: `${((mark - min) / (max - min)) * 100}%` }}
              />
            ))}
          </div>
        ) : null}
        {Array.from({ length: _values.length }, (_, index) => (
          <SliderPrimitive.Thumb
            data-slot="slider-thumb"
            key={index}
            getAriaLabel={getThumbAriaLabel}
            getAriaValueText={getThumbAriaValueText}
            className="relative block size-3 shrink-0 cursor-grab rounded-md border border-ring bg-white ring-ring/50 transition-[scale,box-shadow] duration-150 ease-out select-none after:absolute after:-inset-2 group-hover/slider:ring-2 hover:scale-125 hover:ring-4 focus-visible:ring-4 focus-visible:outline-hidden data-dragging:scale-125 data-dragging:cursor-grabbing data-dragging:ring-4 disabled:pointer-events-none disabled:opacity-50"
          />
        ))}
      </SliderPrimitive.Control>
    </SliderPrimitive.Root>
  )
}

export { Slider }
