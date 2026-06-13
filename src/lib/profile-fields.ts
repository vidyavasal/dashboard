import { str, bool, jsonArray } from "@/lib/parse";
import type {
  NewStudentProfile,
  QualificationRow,
  ProfileDocument,
} from "@/lib/db/schema";

/**
 * Map the shared ProfileFields form into the columns for a profile update.
 * Used by BOTH the public student form (/profile/<token>) and the admin
 * editor so the two never drift. Excludes name/phone (required, handled by the
 * caller) and the deprecated last* education columns (superseded by the
 * qualifications JSONB; left untouched on update).
 */
export function profileFieldsFromForm(
  fd: FormData
): Partial<NewStudentProfile> {
  return {
    email: str(fd, "email"),
    sex: str(fd, "sex"),
    dob: str(fd, "dob"),
    guardianName: str(fd, "guardianName"),
    guardianPhone: str(fd, "guardianPhone"),
    // Program / specialization
    programLevel: str(fd, "programLevel"),
    universityId: str(fd, "universityId"),
    courseId: str(fd, "courseId"),
    specializationType: str(fd, "specializationType"),
    specialization: str(fd, "specialization"),
    // Personal details for the university portal
    areaType: str(fd, "areaType"),
    fatherName: str(fd, "fatherName"),
    motherName: str(fd, "motherName"),
    annualIncome: str(fd, "annualIncome"),
    nationality: str(fd, "nationality"),
    religion: str(fd, "religion"),
    bloodGroup: str(fd, "bloodGroup"),
    category: str(fd, "category"),
    aadhaarNumber: str(fd, "aadhaarNumber"),
    abcId: str(fd, "abcId"),
    studentOccupation: str(fd, "studentOccupation"),
    studentOccupationDetails: str(fd, "studentOccupationDetails"),
    // Contact person
    contactPerson: str(fd, "contactPerson"),
    contactMobile: str(fd, "contactMobile"),
    contactEmail: str(fd, "contactEmail"),
    contactOccupation: str(fd, "contactOccupation"),
    contactOccupationDetails: str(fd, "contactOccupationDetails"),
    // Permanent address
    address: str(fd, "address"),
    permCity: str(fd, "permCity"),
    district: str(fd, "district"),
    state: str(fd, "state"),
    permCountry: str(fd, "permCountry"),
    pincode: str(fd, "pincode"),
    // Correspondence address
    corrSameAsPermanent: bool(fd, "corrSameAsPermanent"),
    corrAddress: str(fd, "corrAddress"),
    corrCity: str(fd, "corrCity"),
    corrDistrict: str(fd, "corrDistrict"),
    corrState: str(fd, "corrState"),
    corrCountry: str(fd, "corrCountry"),
    corrPincode: str(fd, "corrPincode"),
    // Repeaters (JSONB)
    qualifications: jsonArray<QualificationRow>(fd, "qualifications"),
    documents: jsonArray<ProfileDocument>(fd, "documents"),
    documentsNote: str(fd, "documentsNote"),
  };
}
