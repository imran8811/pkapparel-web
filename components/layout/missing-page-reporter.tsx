"use client";

import { useEffect } from "react";
import { reportMissingPage } from "@/lib/actions/missing-pages";

/** Tells the API which address showed "page not found", once per visit, so staff can redirect it. */
export function MissingPageReporter() {
  useEffect(() => {
    void reportMissingPage(window.location.pathname, document.referrer || null);
  }, []);

  return null;
}
