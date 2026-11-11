export type UserFormFieldOption = {
  label: string;
  value: string;
  [key: string]: unknown;
};

export type UserFormFieldValidation = {
  required?: boolean | string;
  min?: number;
  max?: number;
  pattern?: string;
  [key: string]: unknown;
};

export type UserFormField = {
  id: number | string;
  name: string;
  label: string;
  type: "text" | "email" | "password" | "dropdown" | "textarea" | "radio" | "custom" | "date" | "dob" | "datetime" | "daterange";
  placeholder?: string;
  visible?: boolean;
  options?: UserFormFieldOption[];
  optionKey?: string;
  optionValue?: string;
  validationRules?: UserFormFieldValidation;
  gridCols?: string;
  helpText?: string;
};

export type UserFormSection = {
  id: number;
  sectionTitle: string;
  sectionSubtitle?: string;
  sectionFields: UserFormField[];
};

export const addUserFormSections: UserFormSection[] = [
  {
    id: 1,
    sectionTitle: "User Details",
    sectionSubtitle: "Basic details and login credentials for the user",
    sectionFields: [
      {
        id: "firstName",
        name: "firstName",
        label: "First Name",
        type: "text",
        placeholder: "Enter first name",
        visible: true,
        validationRules: {
          required: "First name is required",
        },
      },
      {
        id: "middleName",
        name: "middleName",
        label: "Middle Name (Optional)",
        type: "text",
        placeholder: "Enter middle name",
        visible: true,
        validationRules: {
          required: false,
        },
      },
      {
        id: "lastName",
        name: "lastName",
        label: "Last Name",
        type: "text",
        placeholder: "Enter last name",
        visible: true,
        validationRules: {
          required: "Last name is required",
        },
      },
      {
        id: "email",
        name: "email",
        label: "Email Address",
        type: "email",
        placeholder: "Enter email address",
        visible: true,
        validationRules: {
          required: "Email address is required",
        },
      },
      {
        id: "phone",
        name: "phone",
        label: "Phone Number",
        type: "text",
        placeholder: "+44 1234567802",
        visible: true,
        validationRules: {
          required: false,
        },
      },
      {
        id: "dob",
        name: "dob",
        label: "Date of Birth",
        type: "dob",
        placeholder: "Select Date of Birth",
        visible: true,
        validationRules: {
          required: "Date of birth is required",
        },
      },
      {
        id: "department",
        name: "department",
        label: "Department",
        type: "dropdown",
        placeholder: "Select a department",
        optionKey: "name",
        optionValue: "name",
        visible: true,
        validationRules: {
          required: "Please select a department",
        },
      },
      {
        id: "username",
        name: "username",
        label: "User Name",
        type: "text",
        placeholder: "Enter Username",
        visible: true,
        validationRules: {
          required: "Username is required",
        },
      },
    ],
  },
  {
    id: 2,
    sectionTitle: "Role & Access",
    sectionSubtitle: "Assign a role to define what this user can access and do",
    sectionFields: [
      {
        id: "roleId",
        name: "roleId",
        label: "Select Role",
        type: "dropdown",
        placeholder: "Select Role",
        optionKey: "name",
        optionValue: "id",
        visible: true,
        validationRules: {
          required: "Please select a role",
        },
      },
    ],
  },
  {
    id: 3,
    sectionTitle: "Additional Info",
    sectionSubtitle: "Add optional details to help us personalize the user experience",
    sectionFields: [
      {
        id: "jobTitle",
        name: "jobTitle",
        label: "Job Title",
        type: "text",
        placeholder: "Clinical Lead",
        visible: true,
        validationRules: {
          required: false,
        },
      },
      {
        id: "employeeId",
        name: "employeeId",
        label: "Employee ID (Optional)",
        type: "text",
        placeholder: "EMP-CL-0245",
        visible: true,
        validationRules: {
          required: false,
        },
      },
      {
        id: "location",
        name: "location",
        label: "Work Location",
        type: "dropdown",
        placeholder: "Select Work Location",
        optionKey: "name",
        optionValue: "name",
        visible: true,
        validationRules: {
          required: false,
        },
      },
      {
        id: "timeZone",
        name: "timeZone",
        label: "Time Zone",
        type: "dropdown",
        placeholder: "Select Time Zone",
        visible: true,
        options: [
          { label: "(GMT +00:00) London", value: "Europe/London" },
          { label: "UTC", value: "UTC" },
        ],
        validationRules: {
          required: false,
        },
      },
      {
        id: "managerId",
        name: "managerId",
        label: "Manager (Optional)",
        type: "dropdown",
        placeholder: "Select Manager",
        optionKey: "fullName",
        optionValue: "id",
        visible: true,
        validationRules: {
          required: false,
        },
      },
      {
        id: "notes",
        name: "notes",
        label: "Notes (Optional)",
        type: "textarea",
        placeholder: "Add optional details to help us personalize the user experience.",
        visible: true,
        validationRules: {
          required: false,
        },
      },
    ],
  },
  {
    id: 4,
    sectionTitle: "Review & Invite",
    sectionSubtitle: "Review the details before inviting the user to the platform",
    sectionFields: [],
  },
];

export default addUserFormSections;
