/**
 * Design system de QuéCompro.app — barrel único.
 * Import: `import { Button, HealthChip, Money } from "@/components/ui";`
 */

export { cn, type ClassValue } from "./cn";

export { Avatar, initials, type AvatarProps, type AvatarSize } from "./Avatar";
export { Badge, type BadgeProps, type BadgeSize, type BadgeTone } from "./Badge";
export { Button, type ButtonProps, type ButtonSize, type ButtonVariant } from "./Button";
export {
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  CardTitle,
  type CardHeaderProps,
  type CardProps,
  type CardTitleProps,
} from "./Card";
export { Chip, type ChipProps, type ChipSize, type ChipTone } from "./Chip";
export { Combobox, type ComboboxOption, type ComboboxProps } from "./Combobox";
export { EmptyState, type EmptyStateProps } from "./EmptyState";
export {
  HealthChip,
  type HealthChipProps,
  type HealthChipSize,
  type HealthGrade,
} from "./HealthChip";
export { Input, type InputProps, type InputSize } from "./Input";
export { LiveDot, type LiveDotProps, type LiveDotSize } from "./LiveDot";
export { Modal, type ModalProps, type ModalSize } from "./Modal";
export { formatPEN, Money, type MoneyProps } from "./Money";
export {
  ProgressBar,
  toneForPercent,
  type ProgressBarProps,
  type ProgressSize,
  type ProgressTone,
} from "./ProgressBar";
export { SearchBox, type SearchBoxProps, type SearchBoxSize } from "./SearchBox";
export { Skeleton, type SkeletonProps } from "./Skeleton";
export { Tabs, type TabItem, type TabsProps, type TabsVariant } from "./Tabs";
export { Textarea, type TextareaProps } from "./Textarea";
export {
  ACTION_TOAST_DURATION,
  DEFAULT_TOAST_DURATION,
  Toast,
  type ToastAction,
  type ToastOptions,
  type ToastProps,
  type ToastRecord,
  type ToastTone,
} from "./Toast";
export {
  ToastProvider,
  useToast,
  type ToastContextValue,
  type ToastPlacement,
  type ToastProviderProps,
} from "./ToastProvider";
export { Toggle, type ToggleProps, type ToggleSize } from "./Toggle";

export {
  AlertIcon,
  CheckIcon,
  ChevronDownIcon,
  CloseIcon,
  InfoIcon,
  SearchIcon,
  SpinnerIcon,
  type IconProps,
} from "./icons";
