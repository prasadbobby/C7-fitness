"use client";


interface FastingToggleProps {
  isSelected: boolean;
  onValueChange: (value: boolean) => void;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
}

export function FastingToggle({
  isSelected,
  onValueChange,
  size = "sm",
  disabled = false,
}: FastingToggleProps) {
  const sizeClasses = {
    sm: {
      container: "w-12 h-6",
      thumb: "w-5 h-5",
      translate: "translate-x-6",
      text: "text-xs",
    },
    md: {
      container: "w-14 h-7",
      thumb: "w-6 h-6",
      translate: "translate-x-7",
      text: "text-sm",
    },
    lg: {
      container: "w-16 h-8",
      thumb: "w-7 h-7",
      translate: "translate-x-8",
      text: "text-base",
    },
  };

  const classes = sizeClasses[size];

  return (
    <div className="flex items-center gap-3">
      <span className={`${classes.text} font-medium text-zinc-700 dark:text-zinc-300`}>
        {isSelected ? "Yes" : "No"}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={isSelected}
        disabled={disabled}
        onClick={() => !disabled && onValueChange(!isSelected)}
        className={`
          relative inline-flex ${classes.container} items-center rounded-full
          transition-colors duration-200 ease-in-out focus:outline-none
          ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
          ${
            isSelected
              ? "hover:opacity-90"
              : "bg-gray-300 hover:bg-gray-400"
          }
        `}
        style={isSelected ? { backgroundColor: '#a6ff00' } : {}}
      >
        <span
          className={`
            ${classes.thumb} inline-block transform rounded-full
            bg-white shadow-lg transition-transform duration-200 ease-in-out
            flex items-center justify-center ${classes.text}
            ${isSelected ? classes.translate : "translate-x-0.5"}
          `}
        >
          {isSelected ? "🔥" : ""}
        </span>
      </button>
    </div>
  );
}