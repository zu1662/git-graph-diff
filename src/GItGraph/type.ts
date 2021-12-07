export type GitRepoSet = {
  [repo: string]: GitRepoState;
};
export enum RepoCommitOrdering {
  Default = 'default',
  Date = 'date',
  AuthorDate = 'author-date',
  Topological = 'topo'
}
export enum FileViewType {
  Default = 0,
  Tree = 1,
  List = 2
}
export enum BooleanOverride {
  Default = 0,
  Enabled = 1,
  Disabled = 2
}
export interface IssueLinkingConfig {
  readonly issue: string;
  readonly url: string;
}
export enum PullRequestProvider {
  Bitbucket = 0,
  Custom = 1,
  GitHub = 2,
  GitLab = 3
}
export interface PullRequestConfig {
  readonly hostRootUrl: string;
  readonly sourceRemote: string;
  readonly sourceOwner: string;
  readonly sourceRepo: string;
  readonly destRemote: string | null;
  readonly destOwner: string;
  readonly destRepo: string;
  readonly destProjectId: string;
  readonly destBranch: string;
  readonly provider: PullRequestProvider.Custom;
    readonly custom: {
        readonly name: string;
        readonly templateUrl: string;
    };
}
export interface GitRepoState {
  cdvDivider: number;
  cdvHeight: number;
  columnWidths: SVGAnimatedNumberList[] | null;
  commitOrdering: RepoCommitOrdering;
  fileViewType: FileViewType;
  hideRemotes: string[];
  includeCommitsMentionedByReflogs: BooleanOverride;
  issueLinkingConfig: IssueLinkingConfig | null;
  lastImportAt: number;
  name: string | null;
  onlyFollowFirstParent: BooleanOverride;
  onRepoLoadShowCheckedOutBranch: BooleanOverride;
  onRepoLoadShowSpecificBranches: string[] | null;
  pullRequestConfig: PullRequestConfig | null;
  showRemoteBranches: boolean;
  showRemoteBranchesV2: BooleanOverride;
  showStashes: BooleanOverride;
  showTags: BooleanOverride;
  workspaceFolderIndex: number | null;
}

export enum RepoDropdownOrder {
  FullPath = 0,
  Name = 1,
  WorkspaceFullPath = 2
}

export interface DateFormat {
  readonly type: DateFormatType;
  readonly iso: boolean;
}
export enum DateFormatType {
  DateAndTime = 0,
  DateOnly = 1,
  Relative = 2
}

export enum GraphStyle {
  Rounded = 0,
  Angular = 1
}

export enum GraphUncommittedChangesStyle {
  OpenCircleAtTheUncommittedChanges = 0,
  OpenCircleAtTheCheckedOutCommit = 1
}

export interface GraphConfig {
  readonly colours: ReadonlyArray<string>;
  readonly style: GraphStyle;
  readonly grid: {
      x: number;
      y: number;
      offsetX: number;
      offsetY: number;
      expandY: number;
  };
  readonly uncommittedChanges: GraphUncommittedChangesStyle;
}

export interface MuteCommitsConfig {
  readonly commitsNotAncestorsOfHead: boolean;
  readonly mergeCommits: boolean;
}

export interface GitCommitTag {
  readonly name: string;
  readonly annotated: boolean;
}
export interface GitCommitRemote {
  readonly name: string;
  readonly remote: string | null;
}
export interface GitCommitStash {
  readonly selector: string;
  readonly baseHash: string;
  readonly untrackedFilesHash: string | null;
}
export interface GitCommit {
  readonly hash: string;
  readonly parents: ReadonlyArray<string>;
  readonly author: string;
  readonly email: string;
  readonly date: number;
  readonly message: string;
  readonly heads: ReadonlyArray<string>;
  readonly tags: ReadonlyArray<GitCommitTag>;
  readonly remotes: ReadonlyArray<GitCommitRemote>;
  readonly stash: GitCommitStash | null;
}

export const enum GitSignatureStatus {
  GoodAndValid = 'G',
  GoodWithUnknownValidity = 'U',
  GoodButExpired = 'X',
  GoodButMadeByExpiredKey = 'Y',
  GoodButMadeByRevokedKey = 'R',
  CannotBeChecked = 'E',
  Bad = 'B'
}
export interface GitSignature {
  readonly key: string;
  readonly signer: string;
  readonly status: GitSignatureStatus;
}
export const enum GitFileStatus {
  Added = 'A',
  Modified = 'M',
  Deleted = 'D',
  Renamed = 'R',
  Untracked = 'U'
}
export interface GitFileChange {
  readonly oldFilePath: string;
  readonly newFilePath: string;
  readonly type: GitFileStatus;
  readonly additions: number | null;
  readonly deletions: number | null;
}
export interface GitCommitDetails {
  readonly hash: string;
  readonly parents: ReadonlyArray<string>;
  readonly author: string;
  readonly authorEmail: string;
  readonly authorDate: number;
  readonly committer: string;
  readonly committerEmail: string;
  readonly committerDate: number;
  readonly signature: GitSignature | null;
  readonly body: string;
  readonly fileChanges: ReadonlyArray<GitFileChange>;
}


export interface FileTreeFolder {
  readonly type: 'folder';
  readonly name: string;
  readonly folderPath: string;
  readonly contents: any;
  open: boolean;
  reviewed: boolean;
}

export interface CodeReview {
  id: string;
  lastActive: number;
  lastViewedFile: string | null;
  remainingFiles: string[];
}
export interface ExpandedCommit {
  index: number;
  commitHash: string;
  commitElem: HTMLElement | null;
  compareWithHash: string | null;
  compareWithElem: HTMLElement | null;
  commitDetails: GitCommitDetails | null;
  fileChanges: ReadonlyArray<GitFileChange> | null;
  fileTree: FileTreeFolder | null;
  avatar: string | null;
  codeReview: CodeReview | null;
  lastViewedFile: string | null;
  loading: boolean;
  scrollTop: {
    summary: number,
    fileView: number
  };
  contextMenuOpen: {
    summary: boolean,
    fileView: number
  };
}
