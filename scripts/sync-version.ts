import fs from "fs";
import path from "path";

type VersionFile = { version: string; runtimeVersion?: string };

function readJSON(filePath: string) {
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

function writeJSON(filePath: string, data: unknown) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n");
}

function updatePackageVersion(packageJsonPath: string, version: string) {
  const pkg = readJSON(packageJsonPath);
  if (pkg.version !== version) {
    pkg.version = version;
    writeJSON(packageJsonPath, pkg);
    return true;
  }
  return false;
}

function main() {
  const repoRoot = path.resolve(__dirname, "..");
  const versionFilePath = path.join(repoRoot, "version.json");
  const versionData = readJSON(versionFilePath) as VersionFile;
  const newVersion = versionData.version;

  const targets: string[] = [
    path.join(repoRoot, "src/main/frontend/package.json"),
    path.join(repoRoot, "packages/api/package.json"),
    path.join(repoRoot, "packages/hooks/package.json"),
    path.join(repoRoot, "packages/mappers/package.json"),
    path.join(repoRoot, "packages/types/package.json"),
    path.join(repoRoot, "packages/utils/package.json"),
    path.join(repoRoot, "src/main/mobile/package.json"),
  ];

  let changed = 0;
  for (const pkgPath of targets) {
    if (fs.existsSync(pkgPath)) {
      if (updatePackageVersion(pkgPath, newVersion)) {
        changed += 1;
        // eslint-disable-next-line no-console
        console.log(
          `Updated version in ${path.relative(
            repoRoot,
            pkgPath
          )} -> ${newVersion}`
        );
      }
    }
  }

  // Write frontend .env for runtime version display
  // Preserve existing environment variables and only update REACT_APP_VERSION
  const frontendEnvPath = path.join(repoRoot, "src/main/frontend/.env");
  try {
    let envLines: string[] = [];

    // Read existing .env file if it exists
    if (fs.existsSync(frontendEnvPath)) {
      const existingContent = fs.readFileSync(frontendEnvPath, "utf-8");
      envLines = existingContent.split("\n").filter((line) => {
        // Remove existing REACT_APP_VERSION line if it exists
        const trimmed = line.trim();
        return trimmed && !trimmed.startsWith("REACT_APP_VERSION=");
      });
    }

    // Add or update REACT_APP_VERSION
    envLines.push(`REACT_APP_VERSION=${newVersion}`);

    // Write back to file
    const newContent = envLines.join("\n") + "\n";
    fs.writeFileSync(frontendEnvPath, newContent);

    // eslint-disable-next-line no-console
    console.log(
      `Updated ${path.relative(
        repoRoot,
        frontendEnvPath
      )} with REACT_APP_VERSION=${newVersion} (preserved existing variables)`
    );
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn("Failed to write frontend .env for REACT_APP_VERSION:", e);
  }

  // eslint-disable-next-line no-console
  console.log(`Version sync complete. Updated ${changed} files.`);
}

main();
