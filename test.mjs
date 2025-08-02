import { execSync } from "child_process";

// --- Configuration ---
// The path to the file that holds the version number on each branch.
const VERSION_FILE_PATH = "gradle.properties";
// The regex to extract the version from the file.
// It should capture the MAJOR, MINOR, and PATCH parts.
const VERSION_REGEX = /mod_version\s*=\s*(\d+)\.(\d+)\.(\d+)/;
// The prefix for your maintenance branches.
const MAINTENANCE_BRANCH_PREFIX = "origin/mc/";
// --- End Configuration ---

/**
 * Reads the version from the gradle.properties file on a specific git branch.
 * @param {string} branchName The name of the branch (e.g., 'origin/mc/1.21.7').
 * @returns {string|null} The version string (e.g., '1.6.0') or null if not found.
 */
function getVersionFromBranch(branchName) {
  try {
    // Use `git show` to read the file content from another branch without checking it out.
    const fileContent = execSync(`git show ${branchName}:${VERSION_FILE_PATH}`, {
      encoding: "utf-8",
    });
    const match = fileContent.match(VERSION_REGEX);
    return match ? `${match[1]}.${match[2]}.${match[3]}` : null;
  } catch (error) {
    console.error(
      `Could not read version from branch '${branchName}'. Does it have a '${VERSION_FILE_PATH}'?`,
    );
    return null;
  }
}

// Start with the static parts of your configuration
const config = {
  plugins: [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    [
      "@semantic-release/github",
      {
        assets: [{ path: "build/libs/*.jar", label: "Mod Jar File" }],
      },
    ],
    [
      "@semantic-release/git",
      {
        assets: ["gradle.properties"],
        message:
          "chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}",
      },
    ],
  ],
  branches: [], // This will be populated dynamically
};

// --- Dynamic Branch Population ---

// 1. Get all remote branches from git
const branches = execSync("git branch -r", { encoding: "utf-8" }).split("\n");

// 2. Find the version on the main branch first
const mainVersion = getVersionFromBranch("origin/main");
if (mainVersion) {
  const [major, minor] = mainVersion.split(".");
  config.branches.push({
    name: "main",
    range: `${major}.${minor}.x`,
  });
}

// 3. Find all maintenance branches and determine their version ranges
for (const branch of branches) {
  const branchName = branch.trim();
  if (branchName.startsWith(MAINTENANCE_BRANCH_PREFIX)) {
    const version = getVersionFromBranch(branchName);
    if (version) {
      const [major, minor] = version.split(".");
      const shortBranchName = branchName.replace("origin/", ""); // e.g., 'mc/1.21.7'
      config.branches.push({
        name: shortBranchName,
        range: `${major}.${minor}.x`,
        prerelease: false,
      });
    }
  }
}

console.log("Generated semantic-release config:", JSON.stringify(config, null, 2));

// export default config;
// console.log(config)
