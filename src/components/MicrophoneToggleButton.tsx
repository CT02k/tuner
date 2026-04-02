import Button from "#/components/Button"

type MicrophoneToggleButtonProps = {
  isListening: boolean
  onClick: () => void
}

export default function MicrophoneToggleButton({
  isListening,
  onClick,
}: MicrophoneToggleButtonProps) {
  return (
    <Button
      onClick={onClick}
      fullWidth
      size="md"
      variant={isListening ? "danger" : "primary"}
      className="mb-4 h-10 rounded-full"
    >
      {isListening ? "Stop" : "Start"}
    </Button>
  )
}
