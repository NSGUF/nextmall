import { IconButton, type ButtonProps } from "@chakra-ui/react";
import { FiEdit, FiEye, FiMoreVertical } from "react-icons/fi";

export const EditBtn = (props: ButtonProps) => (
    <IconButton
        variant="outline"
        p={0}
        height="24px"
        width="24px"
        minWidth="auto"
        aria-label="Edit"
        {...props}
    >
        <FiEdit style={{ width: 14 }} />
    </IconButton>
);

export const ViewBtn = (props: ButtonProps) => (
    <IconButton
        variant="outline"
        p={0}
        height="24px"
        width="24px"
        minWidth="auto"
        aria-label="View"
        {...props}
    >
        <FiEye style={{ width: 14 }} />
    </IconButton>
);

export const MenuBtn = (props: ButtonProps) => (
    <IconButton
        variant="outline"
        p={0}
        height="24px"
        width="24px"
        minWidth="auto"
        aria-label="Menu"
        {...props}
    >
        <FiMoreVertical style={{ width: 14 }} />
    </IconButton>
); 