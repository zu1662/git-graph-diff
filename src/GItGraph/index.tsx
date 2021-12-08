import axios from "axios";
import React, { Children } from "react";
import { Graph } from './graph'
import * as GG from './type'
import './base.css'
import './index.css'
import {createFileTree, findCommitElemWithId, getCommitElems, observeElemScroll, alterClass, UNCOMMITTED, SVG_ICONS, insertAfter, formatLongDate, formatShortDate, escapeHtml, abbrevCommit, generateSignatureHtml, generateFileViewHtml, CLASS_COMMIT_DETAILS_OPEN } from './utils'
import { TextFormatter,CLASS_INTERNAL_URL,CLASS_EXTERNAL_URL } from "./textFormatter";

interface IProps { }

class GitGraph extends React.Component<IProps> {
  graph: Graph | null = null
  tableElem: HTMLElement | null = null
  footerElem: HTMLElement | null = null
  viewElem: HTMLElement | null = null
  commitHead: string = ''
  commitLookup: any = {}
  gitBranchHead: string = 'master'
  renderedGitBranchHead: string = ''
  moreCommitsAvailable: boolean = false
  config = {
    graph: {
      colours: ['#0085d9', '#d9008f', '#00d90a', '#d98500', '#a300d9', '#ff0000', '#00d9cc', '#e138e8', '#85d900', '#dc5b23', '#6f24d6', '#ffcc00'],
      style: GG.GraphStyle.Rounded,
      grid: { x: 16, y: 24, offsetX: 16, offsetY: 45, expandY: 250 },
      uncommittedChanges: GG.GraphUncommittedChangesStyle.OpenCircleAtTheUncommittedChanges
    },
    mute: {
      commitsNotAncestorsOfHead: true,
      mergeCommits: true
    },
    defaultColumnVisibility: {
      author: true,
      commit: true,
      date: true
    },
    dateFormat: {
      type: GG.DateFormatType.DateAndTime,
      iso: true
    },
    referenceLabels: {
      branchLabelsAlignedToGraph: false,
      combineLocalAndRemoteBranchLabels: true,
      tagLabelsOnRight: false
    },
    markdown: false,
    fetchAvatars: false
  }
  commits: any = []
  onlyFollowFirstParent = false
  expandedCommit: GG.ExpandedCommit | null = null
  fileViewType: GG.FileViewType = GG.FileViewType.Default
  state = {
    gitRepos: 'D:/Electron Gui/KGUI',
  }
  componentDidMount() {
    this.tableElem = document.getElementById('commitTable')
    this.footerElem = document.getElementById('footer')
    this.viewElem = document.getElementById('viewBox')
    const viewElm = document.getElementById('viewBox')
    this.graph = new Graph('commitGraph', viewElm!, this.config.graph, this.config.mute);
    axios.get('/api/commits').then(res => {
      const result = res.data
      this.moreCommitsAvailable = result.moreCommitsAvailable
      this.loadCommits(result.commits, result.head, result.tags, result.moreCommitsAvailable, false)
    })
  }

  loadCommits(commits: GG.GitCommit[], commitHead: string, tags: ReadonlyArray<string>, moreAvailable: boolean, onlyFollowFirstParent: boolean) {
    this.commits = commits
    this.commitHead = commitHead
    let commitLookup: any = {};
    
    let i: number, commit;
    for (i = 0; i < commits.length; i++) {
      commit = commits[i];
      commitLookup[commit.hash] = i;
    }
    this.commitLookup = commitLookup

    this.graph?.loadCommits(commits, commitHead, commitLookup, onlyFollowFirstParent);
    this.graph?.render(null);
    this.renderTable();
  }

  renderGraph() {
    const colHeadersElem = document.getElementById('tableColHeaders');
		const cdvHeight = 250;
		const headerHeight = colHeadersElem !== null ? colHeadersElem.clientHeight + 1 : 0;
		const expandedCommit = this.expandedCommit;
		const expandedCommitElem = expandedCommit !== null ? document.getElementById('cdv') : null;

		// Update the graphs grid dimensions
		this.config.graph.grid.expandY = expandedCommitElem !== null
			? expandedCommitElem.getBoundingClientRect().height
			: cdvHeight;
		this.config.graph.grid.y = this.commits.length > 0 && this.tableElem!.children.length > 0
			? (this.tableElem!.children[0].clientHeight - headerHeight - (expandedCommit !== null ? cdvHeight : 0)) / this.commits.length
			: this.config.graph.grid.y;
		this.config.graph.grid.offsetY = headerHeight + this.config.graph.grid.y / 2;

		this.graph?.render(expandedCommit);
	}
  renderTable() {
    const colVisibility = this.config.defaultColumnVisibility;
    const currentHash = this.commits.length > 0 && this.commits[0].hash === UNCOMMITTED ? UNCOMMITTED : this.commitHead;
    const vertexColours = this.graph?.getVertexColours() || [];
    const widthsAtVertices = this.config.referenceLabels.branchLabelsAlignedToGraph ? this.graph?.getWidthsAtVertices() : [];
    const mutedCommits = this.graph?.getMutedCommits(currentHash) || [];
    const textFormatter = new TextFormatter(this.commits, null, {
      emoji: true,
      issueLinking: true,
      markdown: this.config.markdown
    });

    let html = '<tr id="tableColHeaders"><th id="tableHeaderGraphCol" class="tableColHeader" data-col="0" width="80">Graph</th><th class="tableColHeader" data-col="1">Description</th>' +
      (colVisibility.date ? '<th class="tableColHeader dateCol" data-col="2">Date</th>' : '') +
      (colVisibility.author ? '<th class="tableColHeader authorCol" data-col="3">Author</th>' : '') +
      (colVisibility.commit ? '<th class="tableColHeader" data-col="4">Commit</th>' : '') +
      '</tr>';

    for (let i = 0; i < this.commits.length; i++) {
      let commit = this.commits[i];
      let message = '<span class="text">' + textFormatter.format(commit.message) + '</span>';
      let date = formatShortDate(commit.date);
      let branchLabels = this.getBranchLabels(commit.heads, commit.remotes);
      let refBranches = '', refTags = '', j, k, refName, remoteName, refActive, refHtml, branchCheckedOutAtCommit: string | null = null;

      for (j = 0; j < branchLabels.heads.length; j++) {
        refName = escapeHtml(branchLabels.heads[j].name);
        refActive = branchLabels.heads[j].name === this.gitBranchHead;
        refHtml = '<span class="gitRef head' + (refActive ? ' active' : '') + '" data-name="' + refName + '">' + SVG_ICONS.branch + '<span class="gitRefName" data-fullref="' + refName + '">' + refName + '</span>';
        for (k = 0; k < branchLabels.heads[j].remotes.length; k++) {
          remoteName = escapeHtml(branchLabels.heads[j].remotes[k]);
          refHtml += '<span class="gitRefHeadRemote" data-remote="' + remoteName + '" data-fullref="' + escapeHtml(branchLabels.heads[j].remotes[k] + '/' + branchLabels.heads[j].name) + '">' + remoteName + '</span>';
        }
        refHtml += '</span>';
        refBranches = refActive ? refHtml + refBranches : refBranches + refHtml;
        if (refActive) branchCheckedOutAtCommit = this.gitBranchHead;
      }
      for (j = 0; j < branchLabels.remotes.length; j++) {
        refName = escapeHtml(branchLabels.remotes[j].name);
        refBranches += '<span class="gitRef remote" data-name="' + refName + '" data-remote="' + (branchLabels.remotes[j].remote !== null ? escapeHtml(branchLabels.remotes[j].remote!) : '') + '">' + SVG_ICONS.branch + '<span class="gitRefName" data-fullref="' + refName + '">' + refName + '</span></span>';
      }

      for (j = 0; j < commit.tags.length; j++) {
        refName = escapeHtml(commit.tags[j].name);
        refTags += '<span class="gitRef tag" data-name="' + refName + '" data-tagtype="' + (commit.tags[j].annotated ? 'annotated' : 'lightweight') + '">' + SVG_ICONS.tag + '<span class="gitRefName" data-fullref="' + refName + '">' + refName + '</span></span>';
      }

      if (commit.stash !== null) {
        refName = escapeHtml(commit.stash.selector);
        refBranches = '<span class="gitRef stash" data-name="' + refName + '">' + SVG_ICONS.stash + '<span class="gitRefName" data-fullref="' + refName + '">' + escapeHtml(commit.stash.selector.substring(5)) + '</span></span>' + refBranches;
      }

      const commitDot = commit.hash === this.commitHead
        ? '<span class="commitHeadDot" title="' + (branchCheckedOutAtCommit !== null
          ? 'The branch ' + escapeHtml('"' + branchCheckedOutAtCommit + '"') + ' is currently checked out at this commit'
          : 'This commit is currently checked out'
        ) + '."></span>'
        : '';

      html += '<tr class="commit' + (commit.hash === currentHash ? ' current' : '') + (mutedCommits[i] ? ' mute' : '') + '"' + (commit.hash !== UNCOMMITTED ? '' : ' id="uncommittedChanges"') + ' data-hash="' + commit.hash + '" data-id="' + i + '" data-color="' + vertexColours[i] + '">' +
        (this.config.referenceLabels.branchLabelsAlignedToGraph ? '<td>' + (refBranches !== '' ? '<span style="margin-left:' + (widthsAtVertices![i] - 4) + 'px"' + refBranches.substring(5) : '') + '</td><td><span class="description">' + commitDot : '<td></td><td><span class="description">' + commitDot + refBranches) + (this.config.referenceLabels.tagLabelsOnRight ? message + refTags : refTags + message) + '</span></td>' +
        (colVisibility.date ? '<td class="dateCol text" title="' + date.title + '">' + date.formatted + '</td>' : '') +
        (colVisibility.author ? '<td class="authorCol text" title="' + escapeHtml(commit.author + ' <' + commit.email + '>') + '">' + escapeHtml(commit.author) + '</td>' : '') +
        (colVisibility.commit ? '<td class="text hashCol" title="' + escapeHtml(commit.hash) + '">' + abbrevCommit(commit.hash) + '</td>' : '') +
        '</tr>';
    }
    this.tableElem!.innerHTML = '<table id="commitTable">' + html + '</table>';
    this.footerElem!.innerHTML = this.moreCommitsAvailable ? '<div id="loadMoreCommitsBtn" class="roundedBtn">Load More Commits</div>' : '';
    this.renderedGitBranchHead = this.gitBranchHead;

    if (this.moreCommitsAvailable) {
      document.getElementById('loadMoreCommitsBtn')!.addEventListener('click', () => {
        // this.loadMoreCommits();
      });
    }
    document.getElementById('commitTable')!.addEventListener('click', (e:any) => {
      if(e.path) {
        e.path.forEach(item => {
          if(item.nodeName === 'TR' && item.className.includes('commit')) {
            const commitId = item.dataset.id
            const commitHash = item.dataset.hash
            console.log(commitId, commitHash);
            // 先删除之前的cdv
            const cdvDOM = document.getElementById('cdv')
            if(cdvDOM != null) {
              cdvDOM.remove()
            }
            this.renderCommitDetailsView(commitId, commitHash)
          }
        })
      }
    });
  }


  getBranchLabels(heads: ReadonlyArray<string>, remotes: ReadonlyArray<GG.GitCommitRemote>) {
    let headLabels: { name: string; remotes: string[] }[] = [], headLookup: { [name: string]: number } = {}, remoteLabels: ReadonlyArray<GG.GitCommitRemote>;
    for (let i = 0; i < heads.length; i++) {
      headLabels.push({ name: heads[i], remotes: [] });
      headLookup[heads[i]] = i;
    }
    if (this.config.referenceLabels.combineLocalAndRemoteBranchLabels) {
      let remainingRemoteLabels = [];
      for (let i = 0; i < remotes.length; i++) {
        if (remotes[i].remote !== null) { // If the remote of the remote branch ref is known
          let branchName = remotes[i].name.substring(remotes[i].remote!.length + 1);
          if (typeof headLookup[branchName] === 'number') {
            headLabels[headLookup[branchName]].remotes.push(remotes[i].remote!);
            continue;
          }
        }
        remainingRemoteLabels.push(remotes[i]);
      }
      remoteLabels = remainingRemoteLabels;
    } else {
      remoteLabels = remotes;
    }
    return { heads: headLabels, remotes: remoteLabels };
  }

  getCommitOrder(hash1: string, hash2: string) {
		if (this.commitLookup[hash1] > this.commitLookup[hash2]) {
			return { from: hash1, to: hash2 };
		} else {
			return { from: hash2, to: hash1 };
		}
	}

  getFileViewType() {
		return GG.FileViewType.List
	}
  renderCdvFileViewTypeBtns() {
		if (this.expandedCommit === null) return;
		let treeBtnElem = document.getElementById('cdvFileViewTypeTree'), listBtnElem = document.getElementById('cdvFileViewTypeList');
		if (treeBtnElem === null || listBtnElem === null) return;

		let listView = this.getFileViewType() === GG.FileViewType.List;
		alterClass(treeBtnElem, 'active', !listView);
		alterClass(listBtnElem, 'active', listView);
	}

  // 提交详情
  async renderCommitDetailsView(index:number, hash:string) {
    const commitElems = getCommitElems();
    const commitElem = findCommitElemWithId(commitElems, index);
    const result = await axios.get('/api/detail', {params: {hash}})
		const expandedCommit = {
			index: index,
			commitHash: hash,
			commitElem: commitElem,
			commitDetails: result.data.commitDetails,
			fileChanges: result.data.commitDetails.fileChanges,
			fileTree: createFileTree(result.data.commitDetails.fileChanges, null),
			avatar: null,
			codeReview: null,
			lastViewedFile: null,
			loading: false,
			scrollTop: {
				summary: 0,
				fileView: 0
			},
			contextMenuOpen: {
				summary: false,
				fileView: -1
			},
      showSummary: false
		}
    this.expandedCommit = expandedCommit
		if (expandedCommit === null || expandedCommit.commitElem === null) return;

		let elem = document.getElementById('cdv'), html = '<div id="cdvContent">';
		const commitOrder = this.getCommitOrder(expandedCommit.commitHash, expandedCommit.commitHash);
		if (elem === null) {
			elem = document.createElement('tr');
			elem.id = 'cdv';
			elem.className = 'inline';
      elem.style.height = '250px'
			insertAfter(elem, expandedCommit.commitElem);
		}

		if (expandedCommit.loading) {
			html += '<div id="cdvLoading">' + SVG_ICONS.loading + ' Loading ' + (expandedCommit.commitHash !== UNCOMMITTED ? 'Commit Details' : 'Uncommitted Changes') + ' ...</div>';
		} else {
			// Commit details should be shown
      if (expandedCommit.commitHash !== UNCOMMITTED) {
        const textFormatter = new TextFormatter(this.commits, null, {
          commits: true,
          emoji: true,
          issueLinking: true,
          markdown: this.config.markdown,
          multiline: true,
          urls: true
        });
        const commitDetails = expandedCommit.commitDetails!;
        if(expandedCommit.showSummary) {
          html += '<div id="cdvSummary">';
          const parents = commitDetails.parents?.length > 0
          ? commitDetails.parents.map((parent:any) => {
            const escapedParent = escapeHtml(parent);
            return typeof this.commitLookup[parent] === 'number'
              ? '<span class="' + CLASS_INTERNAL_URL + '" data-type="commit" data-value="' + escapedParent + '" tabindex="-1">' + escapedParent + '</span>'
              : escapedParent;
          }).join(', ')
          : 'None';
        html += '<span class="cdvSummaryTop' + (expandedCommit.avatar !== null ? ' withAvatar' : '') + '"><span class="cdvSummaryTopRow"><span class="cdvSummaryKeyValues">'
          + '<b>Commit: </b>' + escapeHtml(commitDetails.hash) + '<br>'
          + '<b>Parents: </b>' + parents + '<br>'
          + '<b>Author: </b>' + escapeHtml(commitDetails.author) + (commitDetails.authorEmail !== '' ? ' &lt;<a class="' + CLASS_EXTERNAL_URL + '" href="mailto:' + escapeHtml(commitDetails.authorEmail) + '" tabindex="-1">' + escapeHtml(commitDetails.authorEmail) + '</a>&gt;' : '') + '<br>'
          + (commitDetails.authorDate !== commitDetails.committerDate ? '<b>Author Date: </b>' + formatLongDate(commitDetails.authorDate) + '<br>' : '')
          + '<b>Committer: </b>' + escapeHtml(commitDetails.committer) + (commitDetails.committerEmail !== '' ? ' &lt;<a class="' + CLASS_EXTERNAL_URL + '" href="mailto:' + escapeHtml(commitDetails.committerEmail) + '" tabindex="-1">' + escapeHtml(commitDetails.committerEmail) + '</a>&gt;' : '') + (commitDetails.signature !== null ? generateSignatureHtml(commitDetails.signature) : '') + '<br>'
          + '<b>' + (commitDetails.authorDate !== commitDetails.committerDate ? 'Committer ' : '') + 'Date: </b>' + formatLongDate(commitDetails.committerDate)
          + '</span>'
          + (expandedCommit.avatar !== null ? '<span class="cdvSummaryAvatar"><img src="' + expandedCommit.avatar + '"></span>' : '')
          + '</span></span><br><br>' + textFormatter.format(commitDetails.body);
        }
      } else {
        html += 'Displaying all uncommitted changes.';
      }
			html += '</div><div id="cdvFiles"' + (expandedCommit.showSummary ?  '' : ' style="left:0"') + ' >' + generateFileViewHtml(expandedCommit.fileTree!, expandedCommit.fileChanges!, expandedCommit.lastViewedFile, expandedCommit.contextMenuOpen.fileView, this.getFileViewType(), commitOrder.to === UNCOMMITTED);
		}
		html += '</div><div id="cdvControls" style="right: 15px"><div id="cdvClose" class="cdvControlBtn" title="Close">' + SVG_ICONS.close + '</div>' +
			(!expandedCommit.loading ? '<div id="cdvFileViewTypeTree" class="cdvControlBtn cdvFileViewTypeBtn" title="File Tree View">' + SVG_ICONS.fileTree + '</div><div id="cdvFileViewTypeList" class="cdvControlBtn cdvFileViewTypeBtn" title="File List View">' + SVG_ICONS.fileList + '</div>' : '') +
			'</div><div class="cdvHeightResize"></div>';

		elem.innerHTML = '<td><div class="cdvHeightResize"></div></td><td colspan="' + 4 + '">' + html + '</td>';
		this.renderGraph();

    let elemTop = commitElem?.offsetTop || 0;
		let cdvHeight = 250;
    const autoCenter = true
    if (autoCenter) {
      // Center Commit Detail View setting is enabled
      // elemTop - commit height [24px] + (commit details view height + commit height [24px]) / 2 - (view height) / 2
      this.viewElem!.scroll(0, elemTop - 12 + (cdvHeight - this.viewElem!.clientHeight) / 2);
    } else if (elemTop - 32 < this.viewElem!.scrollTop) {
      // Commit Detail View is opening above what is visible on screen
      // elemTop - commit height [24px] - desired gap from top [8px] < view scroll offset
      this.viewElem!.scroll(0, elemTop - 32);
    } else if (elemTop + cdvHeight - this.viewElem!.clientHeight + 8 > this.viewElem!.scrollTop) {
      // Commit Detail View is opening below what is visible on screen
      // elemTop + commit details view height + desired gap from bottom [8px] - view height > view scroll offset
      this.viewElem!.scroll(0, elemTop + cdvHeight - this.viewElem!.clientHeight + 8);
    }

		document.getElementById('cdvClose')!.addEventListener('click', () => {
			const cdvDOM = document.getElementById('cdv')
      if(cdvDOM) cdvDOM.remove()
		});

		if (!expandedCommit.loading) {
			this.renderCdvFileViewTypeBtns();

      if(expandedCommit.showSummary) {
        observeElemScroll('cdvSummary', expandedCommit.scrollTop.summary, (scrollTop) => {
          if (this.expandedCommit === null) return;
          this.expandedCommit.scrollTop.summary = scrollTop;
          if (this.expandedCommit.contextMenuOpen.summary) {
            this.expandedCommit.contextMenuOpen.summary = false;
          }
        }, () => {});
      }
			

			observeElemScroll('cdvFiles', expandedCommit.scrollTop.fileView, (scrollTop) => {
				if (this.expandedCommit === null) return;
				this.expandedCommit.scrollTop.fileView = scrollTop;
				if (this.expandedCommit.contextMenuOpen.fileView > -1) {
					this.expandedCommit.contextMenuOpen.fileView = -1;
				}
			}, () => {});

			document.getElementById('cdvFileViewTypeTree')!.addEventListener('click', () => {
				this.changeFileViewType(GG.FileViewType.Tree);
			});

			document.getElementById('cdvFileViewTypeList')!.addEventListener('click', () => {
				this.changeFileViewType(GG.FileViewType.List);
			});
		}
	}

  getCommitId(hash: string) {
		return typeof this.commitLookup[hash] === 'number' ? this.commitLookup[hash] : null;
	}

  changeFileViewType(type: GG.FileViewType) {
		const expandedCommit = this.expandedCommit, filesElem = document.getElementById('cdvFiles');
		if (expandedCommit === null || expandedCommit.fileTree === null || expandedCommit.fileChanges === null || filesElem === null) return;
		this.fileViewType = type
		const commitOrder = this.getCommitOrder(expandedCommit.commitHash, expandedCommit.commitHash);
		filesElem.innerHTML = generateFileViewHtml(expandedCommit.fileTree, expandedCommit.fileChanges, null, expandedCommit.contextMenuOpen.fileView, type, commitOrder.to === UNCOMMITTED);
		this.renderCdvFileViewTypeBtns();
	}

  render() {
    return (
      <div id="viewBox">
        <div id="content">
          <div id="commitGraph"></div>
          <div id="commitTable"></div>
        </div>
        <div id="footer"></div>
      </div>
    )
  }
}


export default GitGraph