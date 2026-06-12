interface InputFieldProps {
  label: string;
  type?: string;
  name: string; 
  value?: string;
  placeholder: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function InputField({ label, type = "text", value, name, placeholder, onChange }: InputFieldProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-600">{label}</label>
      <input
        type={type}
        value={value}
        name={name}
        placeholder={placeholder}
        onChange={onChange}
        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:border-brand outline-none transition-colors text-gray-800 placeholder:text-gray-400"
      />
    </div>
  );
}