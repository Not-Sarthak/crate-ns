import { SlotMachineText } from '@/components/slot-machine-text'

export function Intro() {
  return (
    <div className="text-sm leading-relaxed px-4">
      <div className="mb-1 text-black">
        <h1 className="font-bold">
          <SlotMachineText text="crate" />
        </h1>
      </div>
      <div className="text-black/80">
        transform your documentation into structured tutorial scaffolds.
      </div>
    </div>
  )
}
