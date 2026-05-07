import { readFile } from "node:fs/promises";
import { join } from "node:path";

/**
 * Course Reservation PDF şablonunu bulur.
 * 1) COURSE_RESERVATION_TEMPLATE_PATH
 * 2) public/templates/course-reservation.pdf
 * 3) Proje kökü: Course Reservation.pdf
 */
export async function resolveCourseReservationTemplateBuffer(): Promise<Buffer | null> {
  const envPath = process.env.COURSE_RESERVATION_TEMPLATE_PATH?.trim();
  if (envPath) {
    try {
      const b = await readFile(envPath);
      if (b.length) return b;
    } catch {
      /* continue */
    }
  }

  const standard = join(process.cwd(), "public", "templates", "course-reservation.pdf");
  try {
    const b = await readFile(standard);
    if (b.length) return b;
  } catch {
    /* continue */
  }

  const rootFallback = join(process.cwd(), "Course Reservation.pdf");
  try {
    const b = await readFile(rootFallback);
    if (b.length) return b;
  } catch {
    /* not found */
  }

  return null;
}
