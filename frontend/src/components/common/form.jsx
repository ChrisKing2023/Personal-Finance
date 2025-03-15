/* eslint-disable react/prop-types */
import PropTypes from "prop-types";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Select, SelectTrigger, SelectValue } from "../ui/select";
import { SelectContent, SelectItem } from "@radix-ui/react-select";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";

const types = {
  INPUT: "input",
  SELECT: "select",
  TEXTAREA: "textarea",
  CUSTOM: "custom",
};

const CommonForm = ({
  formControls,
  buttonText,
  formData,
  setFormData,
  onSubmit,
  customComponents = {},
}) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const renderInput = (control) => {
    const value = formData[control.name] || "";

    const inputProps = {
      name: control.name,
      placeholder: control.placeholder,
      id: control.name,
      type: control.type || "text",
      value: value,
      onChange: handleChange,
      readOnly: control.readOnly || false,
    };

    switch (control.componentType) {
      case types.INPUT:
        return <Input {...inputProps} />;

      case types.SELECT:
        return (
          <Select
            onValueChange={(selectedValue) =>
              setFormData((prev) => ({
                ...prev,
                [control.name]: selectedValue,
              }))
            }
            value={value}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={control.placeholder} />
            </SelectTrigger>
            <SelectContent>
              {control.options?.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case types.TEXTAREA:
        return (
          <Textarea
            {...inputProps}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                [control.name]: e.target.value,
              }))
            }
          />
        );

      case types.CUSTOM:
        const CustomComponent = customComponents[control.customComponent];
        return (
          CustomComponent && (
            <CustomComponent
              value={formData[control.name]}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  [control.name]: e.target.value,
                }))
              }
            />
          )
        );

      default:
        return <Input {...inputProps} />;
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="flex flex-col gap-4">
        {formControls.map((control) => (
          <div key={control.name} className="mb-4">
            <Label htmlFor={control.name} className="mb-1">
              {control.label}
            </Label>
            {renderInput(control)}
          </div>
        ))}
      </div>
      <Button
        type="submit"
        className="w-full bg-orange-500 text-white hover:bg-orange-700"
      >
        {buttonText || "Submit"}
      </Button>
    </form>
  );
};

CommonForm.propTypes = {
  formControls: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      placeholder: PropTypes.string,
      type: PropTypes.string,
      componentType: PropTypes.oneOf(Object.values(types)).isRequired,
      options: PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.string.isRequired,
          label: PropTypes.string.isRequired,
        })
      ),
      readOnly: PropTypes.bool,
    })
  ).isRequired,
  buttonText: PropTypes.string,
  formData: PropTypes.object.isRequired,
  setFormData: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  customComponents: PropTypes.object,
};

export default CommonForm;
