export const BACKUP_BY_FIRST_NAME = {
  filipi: "bianca",
  bianca: "sabrina",
  sabrina: "filipi",
  leticia: null,
  luana: null,
  arturo: "karen",
  karen: "arturo",
};

export function normalizeFirstName(name) {
  return String(name || "")
    .trim()
    .split(/\s+/)[0]
    ?.toLowerCase();
}

export function formatFirstName(firstName) {
  if (!firstName) return null;
  return firstName.charAt(0).toUpperCase() + firstName.slice(1);
}

export function getBackupInfoFromFullName(fullName) {
  const firstName = normalizeFirstName(fullName);
  const backupFirstName = BACKUP_BY_FIRST_NAME[firstName];

  if (backupFirstName === undefined || backupFirstName === null) {
    return {
      hasConfiguredBackup: backupFirstName !== undefined,
      backupFirstName: null,
      backupDisplayName: "new hire",
    };
  }

  return {
    hasConfiguredBackup: true,
    backupFirstName,
    backupDisplayName: formatFirstName(backupFirstName),
  };
}
