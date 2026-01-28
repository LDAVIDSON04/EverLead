"use client";

import * as React from "react";
import { X } from "lucide-react";

interface AlertDialogContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const AlertDialogContext = React.createContext<AlertDialogContextValue | undefined>(undefined);

function AlertDialog({ children, ...props }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);

  return (
    <AlertDialogContext.Provider value={{ open, setOpen }}>
      <div {...props}>{children}</div>
    </AlertDialogContext.Provider>
  );
}

function AlertDialogTrigger({ asChild, children, ...props }: { asChild?: boolean; children: React.ReactNode } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const context = React.useContext(AlertDialogContext);
  if (!context) throw new Error("AlertDialogTrigger must be used within AlertDialog");

  if (asChild && React.isValidElement(children)) {
    const childProps = children.props as { onClick?: (e: React.MouseEvent) => void };
    return React.cloneElement(children, {
      ...props,
      onClick: (e: React.MouseEvent) => {
        context.setOpen(true);
        if (childProps.onClick) childProps.onClick(e);
      },
    } as any);
  }

  return (
    <button
      {...props}
      onClick={(e) => {
        context.setOpen(true);
        if (props.onClick) props.onClick(e);
      }}
    >
      {children}
    </button>
  );
}

function AlertDialogContent({ children, className = "", ...props }: { children: React.ReactNode; className?: string }) {
  const context = React.useContext(AlertDialogContext);
  if (!context) throw new Error("AlertDialogContent must be used within AlertDialog");

  if (!context.open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/50"
        onClick={() => context.setOpen(false)}
      />
      <div
        className={`fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-gray-200 bg-white p-6 shadow-lg duration-200 rounded-lg ${className}`}
        {...props}
      >
        {children}
      </div>
    </>
  );
}

function AlertDialogHeader({ children, className = "", ...props }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex flex-col space-y-2 text-center sm:text-left ${className}`} {...props}>
      {children}
    </div>
  );
}

function AlertDialogTitle({ children, className = "", ...props }: { children: React.ReactNode; className?: string }) {
  return (
    <h2 className={`text-lg font-semibold ${className}`} {...props}>
      {children}
    </h2>
  );
}

function AlertDialogDescription({ children, className = "", ...props }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={`text-sm text-gray-500 ${className}`} {...props}>
      {children}
    </p>
  );
}

function AlertDialogFooter({ children, className = "", ...props }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 ${className}`} {...props}>
      {children}
    </div>
  );
}

function AlertDialogCancel({ children, className = "", ...props }: { children: React.ReactNode; className?: string } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const context = React.useContext(AlertDialogContext);
  if (!context) throw new Error("AlertDialogCancel must be used within AlertDialog");

  return (
    <button
      className={`px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 ${className}`}
      onClick={() => context.setOpen(false)}
      {...props}
    >
      {children}
    </button>
  );
}

function AlertDialogAction({ children, className = "", ...props }: { children: React.ReactNode; className?: string } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const context = React.useContext(AlertDialogContext);
  if (!context) throw new Error("AlertDialogAction must be used within AlertDialog");

  return (
    <button
      className={`px-4 py-2 bg-navy-800 text-white rounded-lg hover:bg-navy-900 ${className}`}
      onClick={(e) => {
        if (props.onClick) props.onClick(e);
        context.setOpen(false);
      }}
      {...props}
    >
      {children}
    </button>
  );
}

export {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
};
