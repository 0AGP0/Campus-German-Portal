import type { CrmLeadCardProps } from "@/components/ui/card-12";
import type { Lead } from "@/data/leads";
import { FORM_TYPE_LABEL_TR } from "@/data/leadFormFields";

export function leadToCrmLeadCardProps(lead: Lead): CrmLeadCardProps {
  return {
    studentName: lead.name,
    city: lead.city,
    sourceChannel: lead.source,
    formLabel: FORM_TYPE_LABEL_TR[lead.formType],
    formType: lead.formType,
    courseLine: lead.course,
    valueDisplay: lead.value,
    priority: lead.priority,
    language: lead.language,
    createdAt: lead.createdAt,
    nextStep: lead.nextStep,
  };
}

/** @deprecated */
export const leadToOpportunityProps = leadToCrmLeadCardProps;
