import { FC, ReactNode } from "react";
import { Listbox, ListboxItem, ListboxSection } from "@heroui/listbox";
import { ListboxWrapper } from "./listboxWrapper.jsx";
import { AddNoteIcon } from "./icons";
import { CopyDocumentIcon } from "./icons";
import { EditDocumentIcon } from "./icons";
import { DeleteDocumentIcon } from "./icons";
import { cn } from "@/lib/utils";
// Define the props for ListboxWrapper
interface ListboxWrapperProps {
  children: ReactNode;
}

export default function Listboxx() {
  const iconClasses =
    "text-xl text-default-500 pointer-events-none flex-shrink-0";

  return (
    <ListboxWrapper>
      <Listbox variant="flat" aria-label="Listbox menu with sections">
        <ListboxSection title="Actions" showDivider>
          <ListboxItem
            key="new"
            description="Create a new file"
            startContent={<AddNoteIcon className={iconClasses} />}
          >
            New file
          </ListboxItem>
          <ListboxItem
            key="copy"
            description="Copy the file link"
            startContent={<CopyDocumentIcon className={iconClasses} />}
          >
            Copy link
          </ListboxItem>
          <ListboxItem
            key="edit"
            description="Allows you to edit the file"
            startContent={<EditDocumentIcon className={iconClasses} />}
          >
            Edit file
          </ListboxItem>
        </ListboxSection>
        <ListboxSection title="Danger zone">
          <ListboxItem
            key="delete"
            className="text-danger"
            color="danger"
            description="Permanently delete the file"
            startContent={
              <DeleteDocumentIcon className={cn(iconClasses, "text-danger")} />
            }
          >
            Delete file
          </ListboxItem>
        </ListboxSection>
      </Listbox>
    </ListboxWrapper>
  );
}
