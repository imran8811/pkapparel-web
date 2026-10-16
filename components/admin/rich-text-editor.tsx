"use client";

import { useRef, useState, type ReactNode } from "react";
import { EditorContent, Extension, Mark, useEditor, useEditorState, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { TableKit } from "@tiptap/extension-table";
import { Placeholder } from "@tiptap/extensions";
import {
  BoldIcon,
  ImagePlusIcon,
  ItalicIcon,
  LinkIcon,
  ListIcon,
  ListOrderedIcon,
  Loader2Icon,
  MinusIcon,
  QuoteIcon,
  Redo2Icon,
  RemoveFormattingIcon,
  Table2Icon,
  UnderlineIcon,
  Undo2Icon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAdminForm } from "@/components/admin/form";
import { inputClass } from "@/components/admin/styles";
import { useImageUpload, type UploadFolder } from "@/components/admin/image-field";
import { nameToAlt } from "@/lib/admin/prepare-image";
import { cn } from "@/lib/utils";

/*
 * Rich text editor for blog posts and pages. It writes the same small set of HTML the
 * API allows (headings 2–4, lists, links, images, tables, quotes), keeps the "id" of
 * headings and tables (used by "jump to section" links) and keeps <small> text.
 * The HTML goes into a hidden input called `name`; the API cleans it again on save.
 */

/** Keeps id="…" on headings and tables so in-page links keep working. */
const AnchorIds = Extension.create({
  name: "anchorIds",
  addGlobalAttributes() {
    return [
      {
        types: ["heading", "table"],
        attributes: {
          id: {
            default: null,
            keepOnSplit: false,
            parseHTML: (element) => element.getAttribute("id"),
            renderHTML: (attributes) => (attributes.id ? { id: attributes.id } : {}),
          },
        },
      },
    ];
  },
});

/** <small> text (used for labels in a few older articles). */
const Small = Mark.create({
  name: "small",
  parseHTML: () => [{ tag: "small" }],
  renderHTML: ({ HTMLAttributes }) => ["small", HTMLAttributes, 0],
});

export function RichTextEditor({
  name,
  label,
  defaultValue,
  folder,
  placeholder = "Start writing…",
}: {
  name: string;
  label: string;
  defaultValue: string;
  folder: UploadFolder;
  placeholder?: string;
}) {
  const [html, setHtml] = useState(defaultValue);
  const { state } = useAdminForm();
  const error = state.fields?.[name];

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
        strike: false,
        link: {
          openOnClick: false,
          autolink: true,
          defaultProtocol: "https",
          HTMLAttributes: { target: null, rel: null, class: null },
        },
      }),
      Image.configure({ inline: false, allowBase64: false }),
      TableKit.configure({ table: { resizable: false } }),
      Placeholder.configure({ placeholder }),
      AnchorIds,
      Small,
    ],
    content: defaultValue,
    editorProps: {
      attributes: {
        class:
          "prose prose-pk max-w-none min-h-[420px] px-5 py-4 outline-none prose-headings:font-heading prose-headings:tracking-tight prose-img:rounded-xl",
        "aria-label": label,
      },
    },
    onUpdate: ({ editor: current }) => setHtml(current.isEmpty ? "" : current.getHTML()),
  });

  return (
    <div className="grid gap-1.5">
      <span className="text-sm font-medium">{label}</span>
      <div
        className={cn(
          "overflow-hidden rounded-xl border bg-white focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/40",
          error && "border-destructive",
        )}
      >
        {editor ? <Toolbar editor={editor} folder={folder} /> : <div className="h-11 border-b bg-cotton-50" />}
        <EditorContent editor={editor} className="pk-editor max-h-[70vh] overflow-y-auto" />
      </div>
      <input type="hidden" name={name} value={html} />
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}

function Toolbar({ editor, folder }: { editor: Editor; folder: UploadFolder }) {
  const [linkOpen, setLinkOpen] = useState(false);
  const [imageOpen, setImageOpen] = useState(false);

  const active = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      block: e.isActive("heading", { level: 2 })
        ? "h2"
        : e.isActive("heading", { level: 3 })
          ? "h3"
          : e.isActive("heading", { level: 4 })
            ? "h4"
            : "p",
      bold: e.isActive("bold"),
      italic: e.isActive("italic"),
      underline: e.isActive("underline"),
      link: e.isActive("link"),
      bulletList: e.isActive("bulletList"),
      orderedList: e.isActive("orderedList"),
      blockquote: e.isActive("blockquote"),
      table: e.isActive("table"),
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
    }),
  });

  const chain = () => editor.chain().focus();

  return (
    <div className="sticky top-0 z-10 flex flex-wrap items-center gap-0.5 border-b bg-cotton-50 px-2 py-1.5">
      <select
        aria-label="Text style"
        value={active.block}
        onChange={(event) => {
          const value = event.target.value;
          if (value === "p") chain().setParagraph().run();
          else chain().setHeading({ level: Number(value.slice(1)) as 2 | 3 | 4 }).run();
        }}
        className="h-8 rounded-md border bg-white px-2 text-sm"
      >
        <option value="p">Paragraph</option>
        <option value="h2">Heading</option>
        <option value="h3">Subheading</option>
        <option value="h4">Small heading</option>
      </select>
      <Separator />
      <ToolButton label="Bold" active={active.bold} onClick={() => chain().toggleBold().run()}>
        <BoldIcon />
      </ToolButton>
      <ToolButton label="Italic" active={active.italic} onClick={() => chain().toggleItalic().run()}>
        <ItalicIcon />
      </ToolButton>
      <ToolButton label="Underline" active={active.underline} onClick={() => chain().toggleUnderline().run()}>
        <UnderlineIcon />
      </ToolButton>
      <ToolButton label="Link" active={active.link} onClick={() => setLinkOpen(true)}>
        <LinkIcon />
      </ToolButton>
      <Separator />
      <ToolButton label="Bulleted list" active={active.bulletList} onClick={() => chain().toggleBulletList().run()}>
        <ListIcon />
      </ToolButton>
      <ToolButton label="Numbered list" active={active.orderedList} onClick={() => chain().toggleOrderedList().run()}>
        <ListOrderedIcon />
      </ToolButton>
      <ToolButton label="Quote / highlight" active={active.blockquote} onClick={() => chain().toggleBlockquote().run()}>
        <QuoteIcon />
      </ToolButton>
      <ToolButton label="Divider line" onClick={() => chain().setHorizontalRule().run()}>
        <MinusIcon />
      </ToolButton>
      <Separator />
      <ToolButton label="Insert image" onClick={() => setImageOpen(true)}>
        <ImagePlusIcon />
      </ToolButton>
      <ToolButton
        label="Insert table"
        active={active.table}
        onClick={() => chain().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
      >
        <Table2Icon />
      </ToolButton>
      <Separator />
      <ToolButton label="Clear formatting" onClick={() => chain().unsetAllMarks().clearNodes().run()}>
        <RemoveFormattingIcon />
      </ToolButton>
      <ToolButton label="Undo" disabled={!active.canUndo} onClick={() => chain().undo().run()}>
        <Undo2Icon />
      </ToolButton>
      <ToolButton label="Redo" disabled={!active.canRedo} onClick={() => chain().redo().run()}>
        <Redo2Icon />
      </ToolButton>

      {active.table ? (
        <div className="flex w-full flex-wrap items-center gap-1 border-t pt-1.5 text-xs">
          <span className="px-1 font-mono tracking-wider text-muted-foreground uppercase">Table</span>
          <TableButton onClick={() => chain().addRowAfter().run()}>+ Row</TableButton>
          <TableButton onClick={() => chain().addColumnAfter().run()}>+ Column</TableButton>
          <TableButton onClick={() => chain().deleteRow().run()}>− Row</TableButton>
          <TableButton onClick={() => chain().deleteColumn().run()}>− Column</TableButton>
          <TableButton onClick={() => chain().toggleHeaderRow().run()}>Header row</TableButton>
          <TableButton onClick={() => chain().deleteTable().run()} danger>
            Delete table
          </TableButton>
        </div>
      ) : null}

      <LinkDialog editor={editor} open={linkOpen} onOpenChange={setLinkOpen} />
      <ImageDialog editor={editor} folder={folder} open={imageOpen} onOpenChange={setImageOpen} />
    </div>
  );
}

function ToolButton({
  label,
  active,
  disabled,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "grid size-8 place-items-center rounded-md text-denim-900 transition-colors hover:bg-white disabled:opacity-40 [&_svg]:size-4",
        active && "bg-denim-100 text-denim-700 hover:bg-denim-100",
      )}
    >
      {children}
    </button>
  );
}

function TableButton({ onClick, danger, children }: { onClick: () => void; danger?: boolean; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn("rounded-md px-2 py-1 hover:bg-white", danger ? "text-destructive" : "text-denim-900")}
    >
      {children}
    </button>
  );
}

function Separator() {
  return <span aria-hidden className="mx-1 h-5 w-px bg-border" />;
}

function LinkDialog({ editor, open, onOpenChange }: { editor: Editor; open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {/* Mounted only while open, so it starts from the link under the cursor each time. */}
        {open ? <LinkForm editor={editor} close={() => onOpenChange(false)} /> : null}
      </DialogContent>
    </Dialog>
  );
}

function LinkForm({ editor, close }: { editor: Editor; close: () => void }) {
  const current = editor.getAttributes("link") as { href?: string; target?: string };
  const [href, setHref] = useState(current.href ?? "");
  const [newTab, setNewTab] = useState(current.target === "_blank");

  function apply() {
    const url = href.trim();
    const chain = editor.chain().focus().extendMarkRange("link");
    if (url === "") chain.unsetLink().run();
    else chain.setLink({ href: url, target: newTab ? "_blank" : null }).run();
    close();
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Link</DialogTitle>
        <DialogDescription>
          Use a full address (https://…) for other websites, or a path like /factory for pages on this site.
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-3">
        <input
          autoFocus
          value={href}
          onChange={(event) => setHref(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              apply();
            }
          }}
          placeholder="https://… or /wholesale-shop"
          className={inputClass}
          aria-label="Link address"
        />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={newTab} onChange={(event) => setNewTab(event.target.checked)} className="size-4 accent-denim-600" />
          Open in a new tab
        </label>
      </div>
      <DialogFooter>
        {current.href ? (
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              editor.chain().focus().extendMarkRange("link").unsetLink().run();
              close();
            }}
          >
            Remove link
          </Button>
        ) : null}
        <Button type="button" onClick={apply}>
          Apply
        </Button>
      </DialogFooter>
    </>
  );
}

function ImageDialog({
  editor,
  folder,
  open,
  onOpenChange,
}: {
  editor: Editor;
  folder: UploadFolder;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {open ? <ImageForm editor={editor} folder={folder} close={() => onOpenChange(false)} /> : null}
      </DialogContent>
    </Dialog>
  );
}

function ImageForm({ editor, folder, close }: { editor: Editor; folder: UploadFolder; close: () => void }) {
  const [path, setPath] = useState("");
  const [alt, setAlt] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const { busy, error, upload } = useImageUpload(folder, setPath);

  return (
    <>
      <DialogHeader>
        <DialogTitle>Insert image</DialogTitle>
        <DialogDescription>Large photos are resized automatically. JPG, PNG, WebP or GIF, up to 9 MB.</DialogDescription>
      </DialogHeader>
      <div className="grid gap-3">
        <div className="flex items-center gap-3">
          <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => fileInput.current?.click()}>
            {busy ? <Loader2Icon className="animate-spin" /> : null}
            {path ? "Choose another image" : "Choose image"}
          </Button>
          {path ? <span className="truncate text-xs text-muted-foreground">{path.split("/").pop()}</span> : null}
        </div>
        <input
          ref={fileInput}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (!file) return;
            if (!alt) setAlt(nameToAlt(file.name));
            void upload(file);
          }}
        />
        {/* eslint-disable-next-line @next/next/no-img-element -- preview of a just-uploaded file */}
        {path ? <img src={`/${path}`} alt="" className="max-h-48 w-full rounded-lg object-contain bg-cotton-100" /> : null}
        <label className="grid gap-1.5 text-sm font-medium">
          Image description
          <input
            value={alt}
            onChange={(event) => setAlt(event.target.value)}
            placeholder="e.g. Stitching line sewing back pockets"
            className={inputClass}
          />
          <span className="text-xs font-normal text-muted-foreground">Describes the photo for Google and screen readers.</span>
        </label>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </div>
      <DialogFooter>
        <Button
          type="button"
          disabled={!path || busy}
          onClick={() => {
            editor.chain().focus().setImage({ src: `/${path}`, alt: alt.trim() }).run();
            close();
          }}
        >
          Insert
        </Button>
      </DialogFooter>
    </>
  );
}
