
// This file is causing a circular dependency
// We'll update it to simply re-export from the original source
import { useToast, toast } from "@/hooks/use-toast";

export { useToast, toast };
