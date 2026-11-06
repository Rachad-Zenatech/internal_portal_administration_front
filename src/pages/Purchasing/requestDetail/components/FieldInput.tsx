import { Input } from "@/components/ui/input";

export function FieldInput({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: React.ReactNode;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <Input type={type} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
