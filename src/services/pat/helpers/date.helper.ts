export class DateHelper {
  static formatDate(dateInput: any): string | null {
    if (!dateInput) return null;
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return null;
    return d.toISOString().split("T")[0];
  }

  static formatTime(dateInput: any): string | null {
    if (!dateInput) return null;
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return null;
    return d.toTimeString().split(" ")[0];
  }

  static calculateAge(birthDateInput: any, referenceDateInput: any): number | null {
    if (!birthDateInput || !referenceDateInput) return null;
    
    const birth = new Date(birthDateInput);
    const end = new Date(referenceDateInput);
    
    if (isNaN(birth.getTime()) || isNaN(end.getTime())) {
      return null;
    }

    let age = end.getFullYear() - birth.getFullYear();
    const m = end.getMonth() - birth.getMonth();
    
    if (m < 0 || (m === 0 && end.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  }
}
