var ic=Object.defineProperty;var i=(Vl,si)=>ic(Vl,"name",{value:si,configurable:!0});(()=>{var Vl={2410:(k,_,U)=>{"use strict";U.d(_,{A:i(()=>D,"A")});var Y=U(31601),V=U.n(Y),T=U(76314),g=U.n(T),h=g()(V());h.push([k.id,`/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

body a {
	text-decoration: var(--text-link-decoration);
}

h3 {
	display: unset;
	font-size: unset;
	margin-block-start: unset;
	margin-block-end: unset;
	margin-inline-start: unset;
	margin-inline-end: unset;
	font-weight: unset;
}

body a:hover {
	text-decoration: underline;
}

button,
input[type='submit'] {
	color: var(--vscode-button-foreground);
	font-family: var(--vscode-font-family);
	border-radius: 2px;
	border: 1px solid transparent;
	padding: 4px 12px;
	font-size: 13px;
	line-height: 18px;
	white-space: nowrap;
	user-select: none;
}

button:not(.icon-button):not(.danger):not(.secondary),
input[type='submit'] {
	background-color: var(--vscode-button-background);
}

input.select-left {
	border-radius: 2px 0 0 2px;
}

button.select-right {
	border-radius: 0 2px 2px 0;
	width: 24px;
	position: relative;
}

button.select-right span {
	position: absolute;
	top: 2px;
	right: 4px;
}

button:focus,
input[type='submit']:focus {
	outline-color: var(--vscode-focusBorder);
	outline-style: solid;
	outline-width: 1px;
	outline-offset: 2px;
}

button:hover:enabled,
button:focus:enabled,
input[type='submit']:focus:enabled,
input[type='submit']:hover:enabled {
	background-color: var(--vscode-button-hoverBackground);
	cursor: pointer;
}

button.secondary {
	background-color: var(--vscode-button-secondaryBackground);
	color: var(--vscode-button-secondaryForeground);
}

button.secondary:hover:enabled,
button.secondary:focus:enabled,
input[type='submit'].secondary:focus:enabled,
input[type='submit'].secondary:hover:enabled {
	background-color: var(--vscode-button-secondaryHoverBackground);
}

textarea,
input[type='text'] {
	display: block;
	box-sizing: border-box;
	padding: 8px;
	width: 100%;
	resize: vertical;
	font-size: 13px;
	border: 1px solid var(--vscode-dropdown-border);
	background-color: var(--vscode-input-background);
	color: var(--vscode-input-foreground);
	font-family: var(--vscode-font-family);
	border-radius: 2px;
}

textarea::placeholder,
input[type='text']::placeholder {
	color: var(--vscode-input-placeholderForeground);
}

select {
	display: block;
	box-sizing: border-box;
	padding: 4px 8px;
	border-radius: 2px;
	font-size: 13px;
	border: 1px solid var(--vscode-dropdown-border);
	background-color: var(--vscode-dropdown-background);
	color: var(--vscode-dropdown-foreground);
}

textarea:focus,
input[type='text']:focus,
input[type='checkbox']:focus,
select:focus {
	outline: 1px solid var(--vscode-focusBorder);
}

input[type='checkbox'] {
	outline-offset: 1px;
}

.vscode-high-contrast input[type='checkbox'] {
	outline: 1px solid var(--vscode-contrastBorder);
}

.vscode-high-contrast input[type='checkbox']:focus {
	outline: 1px solid var(--vscode-contrastActiveBorder);
}

svg path:first-of-type {
	fill: var(--vscode-foreground);
}

body button:disabled,
input[type='submit']:disabled {
	opacity: 0.4;
}

body .hidden {
	display: none !important;
}

body img.avatar,
body span.avatar-icon svg {
	width: 20px;
	height: 20px;
	border-radius: 50%;
}

body img.avatar {
	vertical-align: middle;
}

.avatar-link {
	flex-shrink: 0;
}

.icon-button {
	display: flex;
	padding: 2px;
	background: transparent;
	border-radius: 4px;
	line-height: 0;
}

.icon-button:hover,
.title .icon-button:hover,
.title .icon-button:focus,
.section .icon-button:hover,
.section .icon-button:focus {
	background-color: var(--vscode-toolbar-hoverBackground);
}

.icon-button:focus,
.title .icon-button:focus,
.section .icon-button:focus {
	outline: 1px solid var(--vscode-focusBorder);
	outline-offset: 1px;
}

.label .icon-button:hover,
.label .icon-button:focus {
	background-color: transparent;
}

.section-item {
	display: flex;
	align-items: center;
	justify-content: space-between;
}

.section-item .avatar-link {
	margin-right: 8px;
}

.section-item .avatar-container {
	flex-shrink: 0;
}

.section-item .login {
	width: 129px;
	flex-shrink: 0;
}

.section-item img.avatar {
	width: 20px;
	height: 20px;
}

.section-icon {
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 3px;
}

.section-icon.changes svg path {
	fill: var(--vscode-list-errorForeground);
}

.section-icon.commented svg path,
.section-icon.requested svg path {
	fill: var(--vscode-list-warningForeground);
}

.section-icon.approved svg path {
	fill: var(--vscode-issues-open);
}

.reviewer-icons {
	display: flex;
	gap: 4px;
}

.push-right {
	margin-left: auto;
}

.avatar-with-author {
	display: flex;
	align-items: center;
}

.author-link {
	font-weight: 600;
	color: var(--vscode-editor-foreground);
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.status-item button {
	margin-left: auto;
	margin-right: 0;
}

.automerge-section {
	display: flex;
}

.automerge-section,
.status-section {
	flex-wrap: wrap;
}

#status-checks .automerge-section {
	align-items: center;
	padding: 16px;
	background: var(--vscode-editorHoverWidget-background);
	border-bottom-left-radius: 3px;
	border-bottom-right-radius: 3px;
}

.automerge-section .merge-select-container {
	margin-left: 8px;
}

.automerge-checkbox-wrapper,
.automerge-checkbox-label {
	display: flex;
	align-items: center;
	margin-right: 4px;
}

.automerge-checkbox-label {
	min-width: 80px;
}

.merge-queue-title .merge-queue-pending {
	color: var(--vscode-list-warningForeground);
}

.merge-queue-title .merge-queue-blocked {
	color: var(--vscode-list-errorForeground);
}

.merge-queue-title {
	font-weight: bold;
	font-size: larger;
}

/** Theming */

.vscode-high-contrast button:not(.secondary):not(.icon-button) {
	background: var(--vscode-button-background);
}


.vscode-high-contrast input {
	outline: none;
	background: var(--vscode-input-background);
	border: 1px solid var(--vscode-contrastBorder);
}

.vscode-high-contrast button:focus {
	border: 1px solid var(--vscode-contrastActiveBorder);
}

.vscode-high-contrast button:hover {
	border: 1px dotted var(--vscode-contrastActiveBorder);
}

::-webkit-scrollbar-corner {
	display: none;
}

.labels-list {
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
}

.label {
	display: flex;
	justify-content: normal;
	padding: 0 8px;
	border-radius: 20px;
	border-style: solid;
	border-width: 1px;
	background: var(--vscode-badge-background);
	color: var(--vscode-badge-foreground);
	font-size: 11px;
	line-height: 18px;
	font-weight: 600;
}

/* split button */

.primary-split-button {
	display: flex;
	flex-grow: 1;
	min-width: 0;
	max-width: 260px;
}

button.split-left {
	border-radius: 2px 0 0 2px;
	flex-grow: 1;
	overflow: hidden;
	white-space: nowrap;
	text-overflow: ellipsis;
	display: flex;
}

.split {
	background-color: var(--vscode-button-background);
	border-top: 1px solid var(--vscode-button-border);
	border-bottom: 1px solid var(--vscode-button-border);
	padding: 4px 0;
}

.split .separator {
	height: 100%;
	width: 1px;
	background-color: var(--vscode-button-separator);
}

.split.disabled {
	opacity: 0.4;
}

.split.secondary {
	background-color: var(--vscode-button-secondaryBackground);
	border-top: 1px solid var(--vscode-button-secondaryBorder);
	border-bottom: 1px solid var(--vscode-button-secondaryBorder);
}

button.split-right {
	border-radius: 0 2px 2px 0;
	cursor: pointer;
	width: 24px;
	position: relative;
}

button.split-right:disabled {
	cursor: default;
}

button.split-right .icon {
	pointer-events: none;
	position: absolute;
	top: 4px;
	right: 4px;
}

button.split-right .icon svg path {
	fill: unset;
}

button.input-box {
	display: block;
	height: 24px;
	margin-top: -4px;
	padding-top: 2px;
	padding-left: 8px;
	text-align: left;
	overflow: hidden;
	white-space: nowrap;
	text-overflow: ellipsis;
	color: var(--vscode-input-foreground) !important;
	background-color: var(--vscode-input-background) !important;
}

button.input-box:active,
button.input-box:focus {
	color: var(--vscode-inputOption-activeForeground) !important;
	background-color: var(--vscode-inputOption-activeBackground) !important;
}

button.input-box:hover:not(:disabled) {
	background-color: var(--vscode-inputOption-hoverBackground) !important;
}

button.input-box:focus {
	border-color: var(--vscode-focusBorder) !important;
}

.dropdown-container {
	display: flex;
	min-width: 0;
	margin: 0;
}

.dropdown-container.spreadable {
	flex-grow: 1;
	width: 100%;
}

button.inlined-dropdown {
	width: 100%;
	max-width: 150px;
	margin-right: 5px;
	display: inline-block;
	text-align: center;
}

.spinner {
	margin-top: 5px;
	margin-left: 5px;
}

.commit-spinner-inline {
	margin-left: 8px;
	display: inline-flex;
	align-items: center;
	vertical-align: middle;
	grid-column: none;
}

.commit-spinner-before {
	margin-right: 6px;
	display: inline-flex;
	align-items: center;
	vertical-align: middle;
}

.loading {
	animation: spinner-rotate 1s linear infinite;
}

@keyframes spinner-rotate {
	0% {
		transform: rotate(0deg);
	}

	100% {
		transform: rotate(360deg);
	}
}`,""]);const D=h},3554:(k,_,U)=>{"use strict";U.d(_,{A:i(()=>D,"A")});var Y=U(31601),V=U.n(Y),T=U(76314),g=U.n(T),h=g()(V());h.push([k.id,`/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

#app {
	display: grid;
	grid-template-columns: 1fr minmax(200px, 300px);
	column-gap: 32px;
}

#title {
	grid-column-start: 1;
	grid-column-end: 3;
	grid-row: 1;
}

#main {
	grid-column: 1;
	grid-row: 2;
	display: flex;
	flex-direction: column;
	gap: 16px;
}

#sidebar {
	display: flex;
	flex-direction: column;
	gap: 16px;
	grid-column: 2;
	grid-row: 2;
}

#project a {
	cursor: pointer;
}

a:focus,
input:focus,
select:focus,
textarea:focus,
.title-text:focus {
	outline: 1px solid var(--vscode-focusBorder);
}

.title-text {
	margin-right: 5px;
}

.title {
	display: flex;
	align-items: flex-start;
	margin: 20px 0 24px;
	padding-bottom: 24px;
	border-bottom: 1px solid var(--vscode-list-inactiveSelectionBackground);
}

.title .pr-number {
	margin-left: 5px;
}

.loading-indicator {
	position: fixed;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
}

.loading-button {
	display: inline-flex;
	align-items: center;
	margin-right: 4px;
}

.comment-body li div {
	display: inline;
}

.comment-body li div.Box,
.comment-body li div.Box div {
	display: block;
}

.comment-body code,
.comment-body a,
span.lineContent {
	overflow-wrap: anywhere;
}

.comment-reactions {
	display: flex;
	flex-direction: row;
}

.comment-reactions div {
	font-size: 1.1em;
	cursor: pointer;
	user-select: none;
}

.comment-reactions .reaction-label {
	border-radius: 5px;
	border: 1px solid var(--vscode-panel-border);
	width: 14px;
}

#title:empty {
	border: none;
}

h2 {
	margin: 0;
}

body hr {
	display: block;
	height: 1px;
	border: 0;
	border-top: 1px solid #555;
	margin: 0 !important;
	padding: 0;
}

body .comment-container .avatar-container {
	margin-right: 12px;
}

body .comment-container .avatar-container a {
	display: flex;
}

body .comment-container .avatar-container img.avatar,
body .comment-container .avatar-container .avatar-icon svg {
	margin-right: 0;
}

.vscode-light .avatar-icon {
	filter: invert(100%);
}

body a.avatar-link:focus {
	outline-offset: 2px;
}

body .comment-container.comment,
body .comment-container.review {
	background-color: var(--vscode-editor-background);
}

.review-comment-container {
	width: 100%;
	max-width: 1000px;
	display: flex;
	flex-direction: column;
	position: relative;
}

body #main>.comment-container>.review-comment-container>.review-comment-header:not(:nth-last-child(2)) {
	border-bottom: 1px solid var(--vscode-editorHoverWidget-border);
}

body .comment-container .review-comment-header {
	position: relative;
	display: flex;
	width: 100%;
	box-sizing: border-box;
	padding: 8px 16px;
	color: var(--vscode-foreground);
	align-items: center;
	background: var(--vscode-editorWidget-background);
	border-top-left-radius: 3px;
	border-top-right-radius: 3px;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.review-comment-header.no-details {
	border-bottom-left-radius: 3px;
	border-bottom-right-radius: 3px;
}

.description-header {
	float: right;
	height: 32px;
}

.review-comment-header .comment-actions {
	margin-left: auto;
}

.review-comment-header .pending {
	color: inherit;
	font-style: italic;
}

.comment-actions button {
	background-color: transparent;
	padding: 0;
	line-height: normal;
	font-size: 11px;
}

.comment-actions button svg {
	margin-right: 0;
	height: 14px;
}

.comment-actions .icon-button {
	padding-left: 2px;
	padding-top: 2px;
}

.status-scroll {
	max-height: 220px;
	overflow-y: auto;
}

.status-check {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 12px 16px;
	border-bottom: 1px solid var(--vscode-editorHoverWidget-border);
}

.status-check-details {
	display: flex;
	align-items: center;
	gap: 8px;
}

#merge-on-github {
	margin-top: 10px;
}

.status-item {
	padding: 12px 16px;
	border-bottom: 1px solid var(--vscode-editorHoverWidget-border);
}

.status-item:first-of-type {
	background: var(--vscode-editorWidget-background);
	border-top-left-radius: 3px;
	border-top-right-radius: 3px;
}

.status-item,
.form-actions,
.ready-for-review-text-wrapper {
	display: flex;
	gap: 8px;
	align-items: center;
}

.status-item .button-container {
	margin-left: auto;
	margin-right: 0;
}

.commit-association {
	display: flex;
	font-style: italic;
	flex-direction: row-reverse;
	padding-top: 7px;
}

.commit-association span {
	flex-direction: row;
}

.email {
	font-weight: bold;
}

button.input-box {
	float: right;
}

.status-item-detail-text {
	display: flex;
	gap: 8px;
}

.status-check-detail-text {
	margin-right: 8px;
}

.status-section p {
	margin: 0;
}

.status-section .check svg path {
	fill: var(--vscode-issues-open);
}

.status-section .close svg path {
	fill: var(--vscode-errorForeground);
}

.status-section .pending svg path,
.status-section .skip svg path {
	fill: var(--vscode-list-warningForeground);
}

.merge-queue-container,
.ready-for-review-container {
	padding: 16px;
	background-color: var(--vscode-editorWidget-background);
	border-bottom-left-radius: 3px;
	border-bottom-right-radius: 3px;
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.ready-for-review-icon {
	width: 16px;
	height: 16px;
}

.ready-for-review-heading {
	font-weight: 600;
}

.ready-for-review-meta {
	font-size: 0.9;
}

#status-checks {
	border: 1px solid var(--vscode-editorHoverWidget-border);
	border-radius: 4px;
}

#status-checks .label {
	display: inline-flex;
	margin-right: 16px;
}

#status-checks a {
	cursor: pointer;
}

#status-checks summary {
	display: flex;
	align-items: center;
}

#status-checks-display-button {
	margin-left: auto;
}

#status-checks .avatar-link svg {
	width: 24px;
	margin-right: 0px;
	vertical-align: middle;
}

.status-check .avatar-link .avatar-icon {
	margin-right: 0px;
}

#status-checks .merge-select-container {
	display: flex;
	align-items: center;
	background-color: var(--vscode-editorWidget-background);
	border-bottom-left-radius: 3px;
	border-bottom-right-radius: 3px;
}

#status-checks .merge-select-container>* {
	margin-right: 5px;
}

#status-checks .merge-select-container>select {
	margin-left: 5px;
}

#status-checks .branch-status-container {
	display: inline-block;
}

#status-checks .branch-status-message {
	display: inline-block;
	line-height: 100%;
	padding: 16px;
}

body .comment-container .review-comment-header>span,
body .comment-container .review-comment-header>a,
body .merged .merged-message>a {
	margin-right: 6px;
}

body .commit .commit-message>a {
	margin-right: 3px;
}

body .comment-container .review-comment-container .pending-label,
body .resolved-container .outdatedLabel {
	background: var(--vscode-badge-background);
	color: var(--vscode-badge-foreground);
	font-size: 11px;
	font-weight: 600;
	border-radius: 20px;
	padding: 4px 8px;
	margin-left: 6px;
}

body .resolved-container .unresolvedLabel {
	font-style: italic;
	margin-left: 5px;
}

body .diff .diffPath {
	margin-right: 4px;
}

.comment-container form,
#merge-comment-form {
	padding: 16px;
	background-color: var(--vscode-editorWidget-background);
}

body .comment-container .comment-body,
.review-body {
	padding: 16px;
	border-top: none;
}

body .comment-container .review-comment-container .review-comment-body {
	display: flex;
	flex-direction: column;
	gap: 16px;
	border: none;
}

body .comment-container .comment-body>p,
body .comment-container .comment-body>div>p,
.comment-container .review-body>p {
	margin-top: 0;
	line-height: 1.5em;
}

body .comment-container .comment-body>p:last-child,
body .comment-container .comment-body>div>p:last-child,
.comment-container .review-body>p:last-child {
	margin-bottom: 0;
}

body {
	margin: auto;
	width: 100%;
	max-width: 1280px;
	padding: 0 32px;
	box-sizing: border-box;
}

body .hidden-focusable {
	height: 0 !important;
	overflow: hidden;
}

.comment-actions button:hover:enabled,
.comment-actions button:focus:enabled {
	background-color: transparent;
}

body button.checkedOut {
	color: var(--vscode-foreground);
	opacity: 1 !important;
	background-color: transparent;
}

body button .icon {
	width: 16px;
	height: 16px;
}

.prIcon {
	display: flex;
	border-radius: 10px;
	margin-right: 5px;
	margin-top: 18px;
}

.overview-title {
	display: flex;
	align-items: center;
}

.overview-title h2 {
	font-size: 32px;
	margin-right: 6px;
}

.overview-title textarea {
	min-height: 50px;
}

.title-container {
	width: 100%;
}

.subtitle {
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	row-gap: 12px;
}

.subtitle .avatar,
.subtitle .avatar-icon svg {
	margin-right: 6px;
}

.subtitle .author {
	display: flex;
	align-items: center;
}

.merge-branches {
	display: inline-flex;
	align-items: center;
	gap: 4px;
	flex-wrap: wrap;
}

.branch-tag {
	margin-top: 3px;
	padding: 2px 4px;
	background: var(--vscode-editorInlayHint-background);
	color: var(--vscode-editorInlayHint-foreground);
	border-radius: 4px;
}

.subtitle .created-at {
	margin-left: auto;
	white-space: nowrap;
}

.button-group {
	display: flex;
	gap: 8px;
	flex-wrap: wrap;
	align-items: flex-start;
}

small-button {
	display: flex;
	font-size: 11px;
	padding: 0 5px;
}

.header-actions {
	display: flex;
	gap: 8px;
	padding-top: 4px;
}

.header-actions>div:first-of-type {
	flex: 1;
}

:not(.status-item)>.small-button {
	font-weight: 600;
}

#status {
	box-sizing: border-box;
	line-height: 18px;
	color: var(--vscode-button-foreground);
	border-radius: 18px;
	padding: 4px 12px;
	margin-right: 10px;
	font-weight: 600;
	display: flex;
	gap: 4px;
}

#status svg path {
	fill: var(--vscode-button-foreground);
}

.vscode-high-contrast #status {
	border: 1px solid var(--vscode-contrastBorder);
	background-color: var(--vscode-badge-background);
	color: var(--vscode-badge-foreground);
}

.vscode-high-contrast #status svg path {
	fill: var(--vscode-badge-foreground);
}

.status-badge-merged {
	background-color: var(--vscode-pullRequests-merged);
}

.status-badge-open {
	background-color: var(--vscode-pullRequests-open);
}

.status-badge-closed {
	background-color: var(--vscode-pullRequests-closed);
}

.status-badge-draft {
	background-color: var(--vscode-pullRequests-draft);
}

.section {
	padding-bottom: 16px;
	border-bottom: 1px solid var(--vscode-editorWidget-border);
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.section:last-of-type {
	padding-bottom: 0px;
	border-bottom: none;
}

.section-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.section-header.clickable {
	cursor: pointer;
}

.section-header .section-title {
	font-weight: 600;
}

.section-placeholder {
	color: var(--vscode-descriptionForeground);
}

.assign-yourself:hover {
	cursor: pointer;
}

.section svg {
	width: 16px;
	height: 16px;
	display: block;
	margin-right: 0;
}

.section .icon-button,
.section .icon-button .icon {
	color: currentColor;
}

.icon-button-group {
	display: flex;
	flex-direction: row;
}

.section svg path {
	fill: currentColor;
}

.commit svg {
	width: 16px;
	height: auto;
	margin-right: 8px;
	flex-shrink: 0;
}

.comment-container.commit {
	border: none;
	padding: 4px 16px;
}

.comment-container.commit,
.comment-container.merged {
	box-sizing: border-box;
}

.commit,
.review,
.merged {
	display: flex;
	width: 100%;
	border: none;
	color: var(--vscode-foreground);
}

.review {
	margin: 0px 8px;
	padding: 4px 0;
}

.commit .commit-message,
.commit .timeline-with-detail,
.merged .merged-message {
	align-items: center;
	overflow: hidden;
	flex-grow: 1;
}

.commit .commit-message,
.merged .merged-message {
	display: flex;
}

.commit .timeline-with-detail {
	display: block;
}

.commit-message-detail {
	margin-left: 20px;
}

.commit .commit-message .avatar-container,
.merged .merged-message .avatar-container {
	margin-right: 4px;
	flex-shrink: 0;
}

.commit-message .icon {
	padding-top: 2px;
}

.commit .avatar-container .avatar,
.commit .avatar-container .avatar-icon,
.commit .avatar-container .avatar-icon svg,
.merged .avatar-container .avatar,
.merged .avatar-container .avatar-icon,
.merged .avatar-container .avatar-icon svg {
	width: 18px;
	height: 18px;
}

.message-container {
	display: inline-grid;
}

.commit .commit-message .message,
.merged .merged-message .message {
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.commit .commit-message a.message {
	cursor: pointer;
}

.timeline-detail {
	display: flex;
	align-items: center;
	gap: 8px;
}

.commit .sha {
	min-width: 50px;
	font-family: var(--vscode-editor-font-family);
	margin-bottom: -2px;
	cursor: pointer;
}

.merged .merged-message .message,
.merged .inline-sha {
	margin: 0 4px 0 0;
}

.merged svg {
	width: 14px;
	height: auto;
	margin-right: 8px;
	flex-shrink: 0;
}

.details {
	display: flex;
	flex-direction: column;
	gap: 12px;
	width: 100%;
}

#description .comment-container {
	padding-top: 0px;
}

.comment-container {
	position: relative;
	width: 100%;
	display: flex;
	margin: 0;
	align-items: center;
	border-radius: 4px;
	border: 1px solid var(--vscode-editorHoverWidget-border);
}

.comment-container[data-type='commit'] {
	padding: 8px 0;
	border: none;
}

.comment-container[data-type='commit']+.comment-container[data-type='commit'] {
	border-top: none;
}

.comment-body .review-comment {
	box-sizing: border-box;
	border-top: 1px solid var(--vscode-editorHoverWidget-border);
}

.resolve-comment-row {
	display: flex;
	align-items: center;
	padding: 16px;
	background-color: var(--vscode-editorHoverWidget-background);
	border-top: 1px solid var(--vscode-editorHoverWidget-border);
	border-bottom-left-radius: 3px;
	border-bottom-right-radius: 3px;
}

.review-comment-container .review-comment .review-comment-header {
	padding: 16px 16px 8px 16px;
	border: none;
	background: none;
}

.review-comment-container .review-comment .comment-body {
	border: none;
	padding: 0px 16px 8px 16px;
}

.review-comment-container .review-comment .comment-body:last-of-type {
	padding: 0px 16px 16px 16px;
}

.comment-body .line {
	align-items: center;
	display: flex;
	flex-wrap: wrap;
	margin-bottom: 8px;
}

body .comment-form {
	padding: 20px 0 10px;
}

.review-comment-container .comment-form {
	margin: 0 0 0 36px;
	padding: 10px 0;
}

.task-list-item {
	list-style-type: none;
}

#status-checks textarea {
	margin-top: 10px;
}

textarea {
	min-height: 100px;
	max-height: 500px;
}

.editing-form {
	padding: 5px 0;
	display: flex;
	flex-direction: row;
	min-width: 300px;
}

.editing-form .form-actions {
	display: flex;
	gap: 8px;
	justify-content: flex-end;
}

.comment-form .form-actions>button,
.comment-form .form-actions>input[type='submit'] {
	margin-right: 0;
	margin-left: 0;
}

.primary-split-button {
	flex-grow: unset;
}

:not(.button-group) .dropdown-container {
	justify-content: right;
}

:not(.title-editing-form)>.form-actions {
	justify-content: flex-end;
	padding-top: 10px;
}

#rebase-actions {
	flex-direction: row-reverse;
}

.main-comment-form>.form-actions {
	margin-bottom: 10px;
}

.details .comment-body {
	padding: 19px 0;
}

blockquote {
	display: block;
	flex-direction: column;
	margin: 8px 0;
	padding: 8px 12px;
	border-left-width: 5px;
	border-left-style: solid;
}

blockquote p {
	margin: 8px 0;
}

blockquote p:first-child {
	margin-top: 0;
}

blockquote p:last-child {
	margin-bottom: 0;
}

.comment-body a:focus,
.comment-body input:focus,
.comment-body select:focus,
.comment-body textarea:focus {
	outline-offset: -1px;
}

.comment-body hr {
	border: 0;
	height: 2px;
	border-bottom: 2px solid;
}

.comment-body h1 {
	padding-bottom: 0.3em;
	line-height: 1.2;
	border-bottom-width: 1px;
	border-bottom-style: solid;
}

.comment-body h1,
h2,
h3 {
	font-weight: normal;
}

.comment-body h1 code,
.comment-body h2 code,
.comment-body h3 code,
.comment-body h4 code,
.comment-body h5 code,
.comment-body h6 code {
	font-size: inherit;
	line-height: auto;
}

.comment-body table {
	border-collapse: collapse;
}

.comment-body table>thead>tr>th {
	text-align: left;
	border-bottom: 1px solid;
}

.comment-body table>thead>tr>th,
.comment-body table>thead>tr>td,
.comment-body table>tbody>tr>th,
.comment-body table>tbody>tr>td {
	padding: 5px 10px;
}

.comment-body table>tbody>tr+tr>td {
	border-top: 1px solid;
}

code {
	font-family: var(--vscode-editor-font-family), Menlo, Monaco, Consolas, 'Droid Sans Mono', 'Courier New', monospace, 'Droid Sans Fallback';
}

.comment-body .snippet-clipboard-content {
	display: grid;
}

.comment-body video {
	width: 100%;
	border: 1px solid var(--vscode-editorWidget-border);
	border-radius: 4px;
}

.comment-body summary {
	margin-bottom: 8px;
}

.comment-body details summary::marker {
	display: flex;
}

.comment-body details summary svg {
	margin-left: 8px;
}

.comment-body body.wordWrap pre {
	white-space: pre-wrap;
}

.comment-body .mac code {
	font-size: 12px;
	line-height: 18px;
}

.comment-body pre:not(.hljs),
.comment-body pre.hljs code>div {
	padding: 16px;
	border-radius: 3px;
	overflow: auto;
}

.timestamp,
.timestamp:hover {
	color: var(--vscode-descriptionForeground);
	white-space: nowrap;
}

.timestamp {
	overflow: hidden;
	text-overflow: ellipsis;
	padding-left: 8px;
}

/** Theming */

.comment-body pre code {
	color: var(--vscode-editor-foreground);
}

.vscode-light .comment-body pre:not(.hljs),
.vscode-light .comment-body code>div {
	background-color: rgba(220, 220, 220, 0.4);
}

.vscode-dark .comment-body pre:not(.hljs),
.vscode-dark .comment-body code>div {
	background-color: rgba(10, 10, 10, 0.4);
}

.vscode-high-contrast .comment-body pre:not(.hljs),
.vscode-high-contrast .comment-body code>div {
	background-color: var(--vscode-editor-background);
	border: 1px solid var(--vscode-panel-border);
}

.vscode-high-contrast .comment-body h1 {
	border: 1px solid rgb(0, 0, 0);
}

.vscode-high-contrast .comment-container .review-comment-header,
.vscode-high-contrast #status-checks {
	background: none;
	border: 1px solid var(--vscode-panel-border);
}

.vscode-high-contrast .comment-container .comment-body,
.vscode-high-contrast .review-comment-container .review-body {
	border: 1px solid var(--vscode-panel-border);
}

.vscode-light .comment-body table>thead>tr>th {
	border-color: rgba(0, 0, 0, 0.69);
}

.vscode-dark .comment-body table>thead>tr>th {
	border-color: rgba(255, 255, 255, 0.69);
}

.vscode-light .comment-body h1,
.vscode-light .comment-body hr,
.vscode-light .comment-body table>tbody>tr+tr>td {
	border-color: rgba(0, 0, 0, 0.18);
}

.vscode-dark .comment-body h1,
.vscode-dark .comment-body hr,
.vscode-dark .comment-body table>tbody>tr+tr>td {
	border-color: rgba(255, 255, 255, 0.18);
}

.review-comment-body .diff-container {
	border-radius: 4px;
	border: 1px solid var(--vscode-editorHoverWidget-border);
}

.review-comment-body .diff-container .review-comment-container .comment-container {
	padding-top: 0;
}

.review-comment-body .diff-container .comment-container {
	border: none;
}

.review-comment-body .diff-container .review-comment-container .review-comment-header .avatar-container {
	margin-right: 4px;
}

.review-comment-body .diff-container .review-comment-container .review-comment-header .avatar {
	width: 18px;
	height: 18px;
}

.review-comment-body .diff-container .diff {
	border-top: 1px solid var(--vscode-editorWidget-border);
	overflow: scroll;
}

.resolved-container {
	padding: 6px 12px;
	display: flex;
	align-items: center;
	justify-content: space-between;
	background: var(--vscode-editorWidget-background);
	border-top-left-radius: 3px;
	border-top-right-radius: 3px;
}

.resolved-container .diffPath:hover {
	text-decoration: underline;
	color: var(--vscode-textLink-activeForeground);
	cursor: pointer;
}

.diff .diffLine {
	display: flex;
	font-size: 12px;
	line-height: 20px;
}

.win32 .diff .diffLine {
	font-family: var(--vscode-editor-font-family), Consolas, Inconsolata, 'Courier New', monospace;
}

.darwin .diff .diffLine {
	font-family: var(--vscode-editor-font-family), Monaco, Menlo, Inconsolata, 'Courier New', monospace;
}

.linux .diff .diffLine {
	font-family: var(--vscode-editor-font-family), 'Droid Sans Mono', Inconsolata, 'Courier New', monospace, 'Droid Sans Fallback';
}

.diff .diffLine.add {
	background-color: var(--vscode-diffEditor-insertedTextBackground);
}

.diff .diffLine.delete {
	background-color: var(--vscode-diffEditor-removedTextBackground);
}

.diff .diffLine .diffTypeSign {
	user-select: none;
	padding-right: 5px;
}

.diff .diffLine .lineNumber {
	width: 1%;
	min-width: 50px;
	padding-right: 10px;
	padding-left: 10px;
	font-size: 12px;
	line-height: 20px;
	text-align: right;
	white-space: nowrap;
	box-sizing: border-box;
	display: block;
	user-select: none;
	font-family: var(--vscode-editor-font-family);
}

.github-checkbox {
	pointer-events: none;
}

.github-checkbox input {
	color: rgb(84, 84, 84);
	opacity: 0.6;
}

/* High Contrast Mode */

.vscode-high-contrast a:focus {
	outline-color: var(--vscode-contrastActiveBorder);
}

.vscode-high-contrast .title {
	border-bottom: 1px solid var(--vscode-contrastBorder);
}

.vscode-high-contrast .diff .diffLine {
	background: none;
}

.vscode-high-contrast .resolved-container {
	background: none;
}

.vscode-high-contrast .diff-container {
	border: 1px solid var(--vscode-contrastBorder);
}

.vscode-high-contrast .diff .diffLine.add {
	border: 1px dashed var(--vscode-diffEditor-insertedTextBorder);
}

.vscode-high-contrast .diff .diffLine.delete {
	border: 1px dashed var(--vscode-diffEditor-removedTextBorder);
}

@media (max-width: 768px) {
	.title {
		border-bottom: none;
		padding-bottom: 0px;
	}

	#app {
		display: block;
	}

	#sidebar {
		display: grid;
		column-gap: 20px;
		row-gap: 12px;
		grid-template-columns: calc(50% - 10px) calc(50% - 10px);
		padding: 0;
	}

	.section-content {
		display: flex;
		flex-wrap: wrap;
	}

	.section-item {
		display: flex;
	}

	body .hidden-focusable {
		height: initial;
		overflow: initial;
	}

	.section-header button {
		display: flex;
	}

	.section-item .login {
		width: auto;
		margin-right: 4px;
	}

	/* Hides bottom borders on bottom two sections */
	.section:nth-last-child(-n + 2) {
		border-bottom: none;
	}
}

.icon {
	width: 16px;
	height: 16px;
	font-size: 16px;
	display: flex;
}

.icon.copilot-icon {
	margin-right: 6px;
}

.action-bar {
	position: absolute;
	display: flex;
	justify-content: space-between;
	z-index: 100;
	top: 9px;
	right: 9px;
}

.flex-action-bar {
	display: flex;
	justify-content: space-between;
	align-items: center;
	z-index: 100;
	margin-left: 9px;
	min-width: 42px;
}

.action-bar>button,
.flex-action-bar>button {
	margin-left: 4px;
	margin-right: 4px;
}

.title-editing-form {
	flex-grow: 1;
}

.title-editing-form>.form-actions {
	margin-left: 8px;
}

/* permalinks */
.comment-body .Box p {
	margin-block-start: 0px;
	margin-block-end: 0px;
}

.comment-body .Box {
	border-radius: 4px;
	border-style: solid;
	border-width: 1px;
	border-color: var(--vscode-editorHoverWidget-border);
}

.comment-body .Box-header {
	background-color: var(--vscode-editorWidget-background);
	color: var(--vscode-disabledForeground);
	border-bottom-style: solid;
	border-bottom-width: 1px;
	padding: 8px 16px;
	border-bottom-color: var(--vscode-editorHoverWidget-border);
	border-top-left-radius: 3px;
	border-top-right-radius: 3px;
}

.comment-body .blob-num {
	word-wrap: break-word;
	box-sizing: border-box;
	border: 0 !important;
	padding-top: 0 !important;
	padding-bottom: 0 !important;
	min-width: 50px;
	font-family: var(--vscode-editor-font-family);
	font-size: 12px;
	color: var(--vscode-editorLineNumber-foreground);
	line-height: 20px;
	text-align: right;
	white-space: nowrap;
	vertical-align: top;
	cursor: pointer;
	user-select: none;
}

.comment-body .blob-num::before {
	content: attr(data-line-number);
}

.comment-body .blob-code-inner {
	tab-size: 8;
	border: 0 !important;
	padding-top: 0 !important;
	padding-bottom: 0 !important;
	line-height: 20px;
	vertical-align: top;
	display: table-cell;
	overflow: visible;
	font-family: var(--vscode-editor-font-family);
	font-size: 12px;
	word-wrap: anywhere;
	text-indent: 0;
	white-space: pre-wrap;
}

.comment-body .commit-tease-sha {
	font-family: var(--vscode-editor-font-family);
	font-size: 12px;
}

/* Suggestion */
.comment-body .blob-wrapper.data.file .d-table {
	border-radius: 4px;
	border-style: solid;
	border-width: 1px;
	border-collapse: unset;
	border-color: var(--vscode-editorHoverWidget-border);
}

.comment-body .js-suggested-changes-blob {
	border-collapse: collapse;
}

.blob-code-deletion,
.blob-num-deletion {
	border-collapse: collapse;
	background-color: var(--vscode-diffEditor-removedLineBackground);
}

.blob-code-addition,
.blob-num-addition {
	border-collapse: collapse;
	background-color: var(--vscode-diffEditor-insertedLineBackground);
}

.blob-code-marker-addition::before {
	content: "+ ";
}

.blob-code-marker-deletion::before {
	content: "- ";
}

.markdown-alert.markdown-alert-warning {
	border-left: .25em solid var(--vscode-editorWarning-foreground);
}

.markdown-alert.markdown-alert-warning .markdown-alert-title {
	color: var(--vscode-editorWarning-foreground);
}

.markdown-alert.markdown-alert-note {
	border-left: .25em solid var(--vscode-editorInfo-foreground);
}

.markdown-alert.markdown-alert-note .markdown-alert-title {
	color: var(--vscode-editorInfo-foreground);
}

.markdown-alert.markdown-alert-tip {
	border-left: .25em solid var(--vscode-testing-iconPassed);
}

.markdown-alert.markdown-alert-tip .markdown-alert-title {
	color: var(--vscode-testing-iconPassed);
}

.markdown-alert.markdown-alert-important {
	border-left: .25em solid var(--vscode-statusBar-debuggingBackground);
}

.markdown-alert.markdown-alert-important .markdown-alert-title {
	color: var(--vscode-statusBar-debuggingBackground);
}

.markdown-alert.markdown-alert-caution {
	border-left: .25em solid var(--vscode-editorError-foreground);
}

.markdown-alert.markdown-alert-caution .markdown-alert-title {
	color: var(--vscode-editorError-foreground);
}

.markdown-alert {
	padding: .5rem .5rem;
	margin-bottom: 1rem;
	color: inherit;
}

.markdown-alert .markdown-alert-title {
	display: flex;
	align-items: center;
	line-height: 1;
}

.markdown-alert-title svg {
	padding-right: 3px;
}

.markdown-alert>:first-child {
	margin-top: 0;
}

svg.octicon path {
	display: inline-block;
	overflow: visible !important;
	vertical-align: text-bottom;
	fill: currentColor;
}

.collapsible-sidebar {
	border-top: 1px solid var(--vscode-editorWidget-border);
	border-bottom: 1px solid var(--vscode-editorWidget-border);
	margin-bottom: 24px;
}

.collapsible-sidebar-header {
	display: flex;
	align-items: center;
	cursor: pointer;
	padding: 16px 0px 8px;
	user-select: none;
	outline: none;
}

.collapsible-sidebar-header.expanded {
	padding: 8px 0px;
}

.collapsible-sidebar-header:focus {
	outline: 1px solid var(--vscode-focusBorder);
}

.collapsible-sidebar-title {
	font-size: 13px;
	width: 100%;
}

.collapsible-sidebar-content {
	padding-bottom: 16px;
}

.collapsed-label {
	gap: 8px;
	display: grid;
	grid-template-columns: 1fr 1fr;
	grid-gap: 8px 20px;
}

.collapsed-section {
	gap: 8px;
	display: inline-flex;
	align-items: center;
	min-width: 0;
	overflow: hidden;
	height: 22px;
}

.collapsed-section-label {
	padding-right: 4px;
	font-weight: 600;
	flex-shrink: 0;
}

.collapsed-section-count {
	color: var(--vscode-descriptionForeground);
}

.pill-container {
	display: flex;
	align-items: center;
	min-width: 0;
	flex: 1;
	flex-wrap: nowrap;
	overflow: hidden;
}

.pill-item {
	flex-shrink: 0;
	white-space: nowrap;
	border-radius: 20px;
	margin-right: 2px;
	border-style: none;
}

.pill-overflow {
	color: var(--vscode-descriptionForeground);
	font-size: 13px;
	margin-left: 4px;
	flex-shrink: 0;
	white-space: nowrap;
}

.collapsed-section .stacked-avatar {
	position: absolute;
}

.avatar-stack {
	position: relative;
	height: 22px;
}

.collapsible-label-see-more {
	padding-bottom: 16px;
	display: block;
	font-size: 13px;
	cursor: pointer;
}`,""]);const D=h},76314:k=>{"use strict";k.exports=function(_){var U=[];return U.toString=i(function(){return this.map(function(V){var T="",g=typeof V[5]!="undefined";return V[4]&&(T+="@supports (".concat(V[4],") {")),V[2]&&(T+="@media ".concat(V[2]," {")),g&&(T+="@layer".concat(V[5].length>0?" ".concat(V[5]):""," {")),T+=_(V),g&&(T+="}"),V[2]&&(T+="}"),V[4]&&(T+="}"),T}).join("")},"toString"),U.i=i(function(V,T,g,h,D){typeof V=="string"&&(V=[[null,V,void 0]]);var I={};if(g)for(var $=0;$<this.length;$++){var F=this[$][0];F!=null&&(I[F]=!0)}for(var J=0;J<V.length;J++){var G=[].concat(V[J]);g&&I[G[0]]||(typeof D!="undefined"&&(typeof G[5]=="undefined"||(G[1]="@layer".concat(G[5].length>0?" ".concat(G[5]):""," {").concat(G[1],"}")),G[5]=D),T&&(G[2]&&(G[1]="@media ".concat(G[2]," {").concat(G[1],"}")),G[2]=T),h&&(G[4]?(G[1]="@supports (".concat(G[4],") {").concat(G[1],"}"),G[4]=h):G[4]="".concat(h)),U.push(G))}},"i"),U}},31601:k=>{"use strict";k.exports=function(_){return _[1]}},74353:function(k){(function(_,U){k.exports=U()})(this,function(){"use strict";var _="millisecond",U="second",Y="minute",V="hour",T="day",g="week",h="month",D="quarter",I="year",$="date",F=/^(\d{4})[-/]?(\d{1,2})?[-/]?(\d{0,2})[^0-9]*(\d{1,2})?:?(\d{1,2})?:?(\d{1,2})?[.:]?(\d+)?$/,J=/\[([^\]]+)]|Y{1,4}|M{1,4}|D{1,2}|d{1,4}|H{1,2}|h{1,2}|a|A|m{1,2}|s{1,2}|Z{1,2}|SSS/g,G={name:"en",weekdays:"Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday".split("_"),months:"January_February_March_April_May_June_July_August_September_October_November_December".split("_")},De=i(function(Z,O,H){var re=String(Z);return!re||re.length>=O?Z:""+Array(O+1-re.length).join(H)+Z},"$"),Ve={s:De,z:i(function(Z){var O=-Z.utcOffset(),H=Math.abs(O),re=Math.floor(H/60),X=H%60;return(O<=0?"+":"-")+De(re,2,"0")+":"+De(X,2,"0")},"z"),m:i(function Z(O,H){if(O.date()<H.date())return-Z(H,O);var re=12*(H.year()-O.year())+(H.month()-O.month()),X=O.clone().add(re,h),ue=H-X<0,he=O.clone().add(re+(ue?-1:1),h);return+(-(re+(H-X)/(ue?X-he:he-X))||0)},"t"),a:i(function(Z){return Z<0?Math.ceil(Z)||0:Math.floor(Z)},"a"),p:i(function(Z){return{M:h,y:I,w:g,d:T,D:$,h:V,m:Y,s:U,ms:_,Q:D}[Z]||String(Z||"").toLowerCase().replace(/s$/,"")},"p"),u:i(function(Z){return Z===void 0},"u")},me="en",Ae={};Ae[me]=G;var nt=i(function(Z){return Z instanceof ie},"m"),W=i(function(Z,O,H){var re;if(!Z)return me;if(typeof Z=="string")Ae[Z]&&(re=Z),O&&(Ae[Z]=O,re=Z);else{var X=Z.name;Ae[X]=Z,re=X}return!H&&re&&(me=re),re||!H&&me},"D"),N=i(function(Z,O){if(nt(Z))return Z.clone();var H=typeof O=="object"?O:{};return H.date=Z,H.args=arguments,new ie(H)},"v"),l=Ve;l.l=W,l.i=nt,l.w=function(Z,O){return N(Z,{locale:O.$L,utc:O.$u,x:O.$x,$offset:O.$offset})};var ie=function(){function Z(H){this.$L=W(H.locale,null,!0),this.parse(H)}i(Z,"d");var O=Z.prototype;return O.parse=function(H){this.$d=function(re){var X=re.date,ue=re.utc;if(X===null)return new Date(NaN);if(l.u(X))return new Date;if(X instanceof Date)return new Date(X);if(typeof X=="string"&&!/Z$/i.test(X)){var he=X.match(F);if(he){var ve=he[2]-1||0,Ce=(he[7]||"0").substring(0,3);return ue?new Date(Date.UTC(he[1],ve,he[3]||1,he[4]||0,he[5]||0,he[6]||0,Ce)):new Date(he[1],ve,he[3]||1,he[4]||0,he[5]||0,he[6]||0,Ce)}}return new Date(X)}(H),this.$x=H.x||{},this.init()},O.init=function(){var H=this.$d;this.$y=H.getFullYear(),this.$M=H.getMonth(),this.$D=H.getDate(),this.$W=H.getDay(),this.$H=H.getHours(),this.$m=H.getMinutes(),this.$s=H.getSeconds(),this.$ms=H.getMilliseconds()},O.$utils=function(){return l},O.isValid=function(){return this.$d.toString()!=="Invalid Date"},O.isSame=function(H,re){var X=N(H);return this.startOf(re)<=X&&X<=this.endOf(re)},O.isAfter=function(H,re){return N(H)<this.startOf(re)},O.isBefore=function(H,re){return this.endOf(re)<N(H)},O.$g=function(H,re,X){return l.u(H)?this[re]:this.set(X,H)},O.unix=function(){return Math.floor(this.valueOf()/1e3)},O.valueOf=function(){return this.$d.getTime()},O.startOf=function(H,re){var X=this,ue=!!l.u(re)||re,he=l.p(H),ve=i(function(be,qe){var B=l.w(X.$u?Date.UTC(X.$y,qe,be):new Date(X.$y,qe,be),X);return ue?B:B.endOf(T)},"$"),Ce=i(function(be,qe){return l.w(X.toDate()[be].apply(X.toDate("s"),(ue?[0,0,0,0]:[23,59,59,999]).slice(qe)),X)},"l"),He=this.$W,ze=this.$M,oe=this.$D,Qe="set"+(this.$u?"UTC":"");switch(he){case I:return ue?ve(1,0):ve(31,11);case h:return ue?ve(1,ze):ve(0,ze+1);case g:var at=this.$locale().weekStart||0,wt=(He<at?He+7:He)-at;return ve(ue?oe-wt:oe+(6-wt),ze);case T:case $:return Ce(Qe+"Hours",0);case V:return Ce(Qe+"Minutes",1);case Y:return Ce(Qe+"Seconds",2);case U:return Ce(Qe+"Milliseconds",3);default:return this.clone()}},O.endOf=function(H){return this.startOf(H,!1)},O.$set=function(H,re){var X,ue=l.p(H),he="set"+(this.$u?"UTC":""),ve=(X={},X[T]=he+"Date",X[$]=he+"Date",X[h]=he+"Month",X[I]=he+"FullYear",X[V]=he+"Hours",X[Y]=he+"Minutes",X[U]=he+"Seconds",X[_]=he+"Milliseconds",X)[ue],Ce=ue===T?this.$D+(re-this.$W):re;if(ue===h||ue===I){var He=this.clone().set($,1);He.$d[ve](Ce),He.init(),this.$d=He.set($,Math.min(this.$D,He.daysInMonth())).$d}else ve&&this.$d[ve](Ce);return this.init(),this},O.set=function(H,re){return this.clone().$set(H,re)},O.get=function(H){return this[l.p(H)]()},O.add=function(H,re){var X,ue=this;H=Number(H);var he=l.p(re),ve=i(function(ze){var oe=N(ue);return l.w(oe.date(oe.date()+Math.round(ze*H)),ue)},"d");if(he===h)return this.set(h,this.$M+H);if(he===I)return this.set(I,this.$y+H);if(he===T)return ve(1);if(he===g)return ve(7);var Ce=(X={},X[Y]=6e4,X[V]=36e5,X[U]=1e3,X)[he]||1,He=this.$d.getTime()+H*Ce;return l.w(He,this)},O.subtract=function(H,re){return this.add(-1*H,re)},O.format=function(H){var re=this;if(!this.isValid())return"Invalid Date";var X=H||"YYYY-MM-DDTHH:mm:ssZ",ue=l.z(this),he=this.$locale(),ve=this.$H,Ce=this.$m,He=this.$M,ze=he.weekdays,oe=he.months,Qe=i(function(qe,B,K,de){return qe&&(qe[B]||qe(re,X))||K[B].substr(0,de)},"h"),at=i(function(qe){return l.s(ve%12||12,qe,"0")},"d"),wt=he.meridiem||function(qe,B,K){var de=qe<12?"AM":"PM";return K?de.toLowerCase():de},be={YY:String(this.$y).slice(-2),YYYY:this.$y,M:He+1,MM:l.s(He+1,2,"0"),MMM:Qe(he.monthsShort,He,oe,3),MMMM:Qe(oe,He),D:this.$D,DD:l.s(this.$D,2,"0"),d:String(this.$W),dd:Qe(he.weekdaysMin,this.$W,ze,2),ddd:Qe(he.weekdaysShort,this.$W,ze,3),dddd:ze[this.$W],H:String(ve),HH:l.s(ve,2,"0"),h:at(1),hh:at(2),a:wt(ve,Ce,!0),A:wt(ve,Ce,!1),m:String(Ce),mm:l.s(Ce,2,"0"),s:String(this.$s),ss:l.s(this.$s,2,"0"),SSS:l.s(this.$ms,3,"0"),Z:ue};return X.replace(J,function(qe,B){return B||be[qe]||ue.replace(":","")})},O.utcOffset=function(){return 15*-Math.round(this.$d.getTimezoneOffset()/15)},O.diff=function(H,re,X){var ue,he=l.p(re),ve=N(H),Ce=6e4*(ve.utcOffset()-this.utcOffset()),He=this-ve,ze=l.m(this,ve);return ze=(ue={},ue[I]=ze/12,ue[h]=ze,ue[D]=ze/3,ue[g]=(He-Ce)/6048e5,ue[T]=(He-Ce)/864e5,ue[V]=He/36e5,ue[Y]=He/6e4,ue[U]=He/1e3,ue)[he]||He,X?ze:l.a(ze)},O.daysInMonth=function(){return this.endOf(h).$D},O.$locale=function(){return Ae[this.$L]},O.locale=function(H,re){if(!H)return this.$L;var X=this.clone(),ue=W(H,re,!0);return ue&&(X.$L=ue),X},O.clone=function(){return l.w(this.$d,this)},O.toDate=function(){return new Date(this.valueOf())},O.toJSON=function(){return this.isValid()?this.toISOString():null},O.toISOString=function(){return this.$d.toISOString()},O.toString=function(){return this.$d.toUTCString()},Z}(),Q=ie.prototype;return N.prototype=Q,[["$ms",_],["$s",U],["$m",Y],["$H",V],["$W",T],["$M",h],["$y",I],["$D",$]].forEach(function(Z){Q[Z[1]]=function(O){return this.$g(O,Z[0],Z[1])}}),N.extend=function(Z,O){return Z.$i||(Z(O,ie,N),Z.$i=!0),N},N.locale=W,N.isDayjs=nt,N.unix=function(Z){return N(1e3*Z)},N.en=Ae[me],N.Ls=Ae,N.p={},N})},6279:function(k){(function(_,U){k.exports=U()})(this,function(){"use strict";return function(_,U,Y){_=_||{};var V=U.prototype,T={future:"in %s",past:"%s ago",s:"a few seconds",m:"a minute",mm:"%d minutes",h:"an hour",hh:"%d hours",d:"a day",dd:"%d days",M:"a month",MM:"%d months",y:"a year",yy:"%d years"};function g(D,I,$,F){return V.fromToBase(D,I,$,F)}i(g,"i"),Y.en.relativeTime=T,V.fromToBase=function(D,I,$,F,J){for(var G,De,Ve,me=$.$locale().relativeTime||T,Ae=_.thresholds||[{l:"s",r:44,d:"second"},{l:"m",r:89},{l:"mm",r:44,d:"minute"},{l:"h",r:89},{l:"hh",r:21,d:"hour"},{l:"d",r:35},{l:"dd",r:25,d:"day"},{l:"M",r:45},{l:"MM",r:10,d:"month"},{l:"y",r:17},{l:"yy",d:"year"}],nt=Ae.length,W=0;W<nt;W+=1){var N=Ae[W];N.d&&(G=F?Y(D).diff($,N.d,!0):$.diff(D,N.d,!0));var l=(_.rounding||Math.round)(Math.abs(G));if(Ve=G>0,l<=N.r||!N.r){l<=1&&W>0&&(N=Ae[W-1]);var ie=me[N.l];J&&(l=J(""+l)),De=typeof ie=="string"?ie.replace("%d",l):ie(l,I,N.l,Ve);break}}if(I)return De;var Q=Ve?me.future:me.past;return typeof Q=="function"?Q(De):Q.replace("%s",De)},V.to=function(D,I){return g(D,I,this,!0)},V.from=function(D,I){return g(D,I,this)};var h=i(function(D){return D.$u?Y.utc():Y()},"d");V.toNow=function(D){return this.to(h(this),D)},V.fromNow=function(D){return this.from(h(this),D)}}})},53581:function(k){(function(_,U){k.exports=U()})(this,function(){"use strict";return function(_,U,Y){Y.updateLocale=function(V,T){var g=Y.Ls[V];if(g)return(T?Object.keys(T):[]).forEach(function(h){g[h]=T[h]}),g}}})},17334:k=>{function _(U,Y,V){var T,g,h,D,I;Y==null&&(Y=100);function $(){var J=Date.now()-D;J<Y&&J>=0?T=setTimeout($,Y-J):(T=null,V||(I=U.apply(h,g),h=g=null))}i($,"later");var F=i(function(){h=this,g=arguments,D=Date.now();var J=V&&!T;return T||(T=setTimeout($,Y)),J&&(I=U.apply(h,g),h=g=null),I},"debounced");return F.clear=function(){T&&(clearTimeout(T),T=null)},F.flush=function(){T&&(I=U.apply(h,g),h=g=null,clearTimeout(T),T=null)},F}i(_,"debounce"),_.debounce=_,k.exports=_},37007:k=>{"use strict";var _=typeof Reflect=="object"?Reflect:null,U=_&&typeof _.apply=="function"?_.apply:i(function(N,l,ie){return Function.prototype.apply.call(N,l,ie)},"ReflectApply"),Y;_&&typeof _.ownKeys=="function"?Y=_.ownKeys:Object.getOwnPropertySymbols?Y=i(function(N){return Object.getOwnPropertyNames(N).concat(Object.getOwnPropertySymbols(N))},"ReflectOwnKeys"):Y=i(function(N){return Object.getOwnPropertyNames(N)},"ReflectOwnKeys");function V(W){console&&console.warn&&console.warn(W)}i(V,"ProcessEmitWarning");var T=Number.isNaN||i(function(N){return N!==N},"NumberIsNaN");function g(){g.init.call(this)}i(g,"EventEmitter"),k.exports=g,k.exports.once=nt,g.EventEmitter=g,g.prototype._events=void 0,g.prototype._eventsCount=0,g.prototype._maxListeners=void 0;var h=10;function D(W){if(typeof W!="function")throw new TypeError('The "listener" argument must be of type Function. Received type '+typeof W)}i(D,"checkListener"),Object.defineProperty(g,"defaultMaxListeners",{enumerable:!0,get:i(function(){return h},"get"),set:i(function(W){if(typeof W!="number"||W<0||T(W))throw new RangeError('The value of "defaultMaxListeners" is out of range. It must be a non-negative number. Received '+W+".");h=W},"set")}),g.init=function(){(this._events===void 0||this._events===Object.getPrototypeOf(this)._events)&&(this._events=Object.create(null),this._eventsCount=0),this._maxListeners=this._maxListeners||void 0},g.prototype.setMaxListeners=i(function(N){if(typeof N!="number"||N<0||T(N))throw new RangeError('The value of "n" is out of range. It must be a non-negative number. Received '+N+".");return this._maxListeners=N,this},"setMaxListeners");function I(W){return W._maxListeners===void 0?g.defaultMaxListeners:W._maxListeners}i(I,"_getMaxListeners"),g.prototype.getMaxListeners=i(function(){return I(this)},"getMaxListeners"),g.prototype.emit=i(function(N){for(var l=[],ie=1;ie<arguments.length;ie++)l.push(arguments[ie]);var Q=N==="error",Z=this._events;if(Z!==void 0)Q=Q&&Z.error===void 0;else if(!Q)return!1;if(Q){var O;if(l.length>0&&(O=l[0]),O instanceof Error)throw O;var H=new Error("Unhandled error."+(O?" ("+O.message+")":""));throw H.context=O,H}var re=Z[N];if(re===void 0)return!1;if(typeof re=="function")U(re,this,l);else for(var X=re.length,ue=Ve(re,X),ie=0;ie<X;++ie)U(ue[ie],this,l);return!0},"emit");function $(W,N,l,ie){var Q,Z,O;if(D(l),Z=W._events,Z===void 0?(Z=W._events=Object.create(null),W._eventsCount=0):(Z.newListener!==void 0&&(W.emit("newListener",N,l.listener?l.listener:l),Z=W._events),O=Z[N]),O===void 0)O=Z[N]=l,++W._eventsCount;else if(typeof O=="function"?O=Z[N]=ie?[l,O]:[O,l]:ie?O.unshift(l):O.push(l),Q=I(W),Q>0&&O.length>Q&&!O.warned){O.warned=!0;var H=new Error("Possible EventEmitter memory leak detected. "+O.length+" "+String(N)+" listeners added. Use emitter.setMaxListeners() to increase limit");H.name="MaxListenersExceededWarning",H.emitter=W,H.type=N,H.count=O.length,V(H)}return W}i($,"_addListener"),g.prototype.addListener=i(function(N,l){return $(this,N,l,!1)},"addListener"),g.prototype.on=g.prototype.addListener,g.prototype.prependListener=i(function(N,l){return $(this,N,l,!0)},"prependListener");function F(){if(!this.fired)return this.target.removeListener(this.type,this.wrapFn),this.fired=!0,arguments.length===0?this.listener.call(this.target):this.listener.apply(this.target,arguments)}i(F,"onceWrapper");function J(W,N,l){var ie={fired:!1,wrapFn:void 0,target:W,type:N,listener:l},Q=F.bind(ie);return Q.listener=l,ie.wrapFn=Q,Q}i(J,"_onceWrap"),g.prototype.once=i(function(N,l){return D(l),this.on(N,J(this,N,l)),this},"once"),g.prototype.prependOnceListener=i(function(N,l){return D(l),this.prependListener(N,J(this,N,l)),this},"prependOnceListener"),g.prototype.removeListener=i(function(N,l){var ie,Q,Z,O,H;if(D(l),Q=this._events,Q===void 0)return this;if(ie=Q[N],ie===void 0)return this;if(ie===l||ie.listener===l)--this._eventsCount===0?this._events=Object.create(null):(delete Q[N],Q.removeListener&&this.emit("removeListener",N,ie.listener||l));else if(typeof ie!="function"){for(Z=-1,O=ie.length-1;O>=0;O--)if(ie[O]===l||ie[O].listener===l){H=ie[O].listener,Z=O;break}if(Z<0)return this;Z===0?ie.shift():me(ie,Z),ie.length===1&&(Q[N]=ie[0]),Q.removeListener!==void 0&&this.emit("removeListener",N,H||l)}return this},"removeListener"),g.prototype.off=g.prototype.removeListener,g.prototype.removeAllListeners=i(function(N){var l,ie,Q;if(ie=this._events,ie===void 0)return this;if(ie.removeListener===void 0)return arguments.length===0?(this._events=Object.create(null),this._eventsCount=0):ie[N]!==void 0&&(--this._eventsCount===0?this._events=Object.create(null):delete ie[N]),this;if(arguments.length===0){var Z=Object.keys(ie),O;for(Q=0;Q<Z.length;++Q)O=Z[Q],O!=="removeListener"&&this.removeAllListeners(O);return this.removeAllListeners("removeListener"),this._events=Object.create(null),this._eventsCount=0,this}if(l=ie[N],typeof l=="function")this.removeListener(N,l);else if(l!==void 0)for(Q=l.length-1;Q>=0;Q--)this.removeListener(N,l[Q]);return this},"removeAllListeners");function G(W,N,l){var ie=W._events;if(ie===void 0)return[];var Q=ie[N];return Q===void 0?[]:typeof Q=="function"?l?[Q.listener||Q]:[Q]:l?Ae(Q):Ve(Q,Q.length)}i(G,"_listeners"),g.prototype.listeners=i(function(N){return G(this,N,!0)},"listeners"),g.prototype.rawListeners=i(function(N){return G(this,N,!1)},"rawListeners"),g.listenerCount=function(W,N){return typeof W.listenerCount=="function"?W.listenerCount(N):De.call(W,N)},g.prototype.listenerCount=De;function De(W){var N=this._events;if(N!==void 0){var l=N[W];if(typeof l=="function")return 1;if(l!==void 0)return l.length}return 0}i(De,"listenerCount"),g.prototype.eventNames=i(function(){return this._eventsCount>0?Y(this._events):[]},"eventNames");function Ve(W,N){for(var l=new Array(N),ie=0;ie<N;++ie)l[ie]=W[ie];return l}i(Ve,"arrayClone");function me(W,N){for(;N+1<W.length;N++)W[N]=W[N+1];W.pop()}i(me,"spliceOne");function Ae(W){for(var N=new Array(W.length),l=0;l<N.length;++l)N[l]=W[l].listener||W[l];return N}i(Ae,"unwrapListeners");function nt(W,N){return new Promise(function(l,ie){function Q(){Z!==void 0&&W.removeListener("error",Z),l([].slice.call(arguments))}i(Q,"eventListener");var Z;N!=="error"&&(Z=i(function(H){W.removeListener(N,Q),ie(H)},"errorListener"),W.once("error",Z)),W.once(N,Q)})}i(nt,"once")},45228:k=>{"use strict";/*
object-assign
(c) Sindre Sorhus
@license MIT
*/var _=Object.getOwnPropertySymbols,U=Object.prototype.hasOwnProperty,Y=Object.prototype.propertyIsEnumerable;function V(g){if(g==null)throw new TypeError("Object.assign cannot be called with null or undefined");return Object(g)}i(V,"toObject");function T(){try{if(!Object.assign)return!1;var g=new String("abc");if(g[5]="de",Object.getOwnPropertyNames(g)[0]==="5")return!1;for(var h={},D=0;D<10;D++)h["_"+String.fromCharCode(D)]=D;var I=Object.getOwnPropertyNames(h).map(function(F){return h[F]});if(I.join("")!=="0123456789")return!1;var $={};return"abcdefghijklmnopqrst".split("").forEach(function(F){$[F]=F}),Object.keys(Object.assign({},$)).join("")==="abcdefghijklmnopqrst"}catch{return!1}}i(T,"shouldUseNative"),k.exports=T()?Object.assign:function(g,h){for(var D,I=V(g),$,F=1;F<arguments.length;F++){D=Object(arguments[F]);for(var J in D)U.call(D,J)&&(I[J]=D[J]);if(_){$=_(D);for(var G=0;G<$.length;G++)Y.call(D,$[G])&&(I[$[G]]=D[$[G]])}}return I}},57975:k=>{"use strict";function _(T){if(typeof T!="string")throw new TypeError("Path must be a string. Received "+JSON.stringify(T))}i(_,"assertPath");function U(T,g){for(var h="",D=0,I=-1,$=0,F,J=0;J<=T.length;++J){if(J<T.length)F=T.charCodeAt(J);else{if(F===47)break;F=47}if(F===47){if(!(I===J-1||$===1))if(I!==J-1&&$===2){if(h.length<2||D!==2||h.charCodeAt(h.length-1)!==46||h.charCodeAt(h.length-2)!==46){if(h.length>2){var G=h.lastIndexOf("/");if(G!==h.length-1){G===-1?(h="",D=0):(h=h.slice(0,G),D=h.length-1-h.lastIndexOf("/")),I=J,$=0;continue}}else if(h.length===2||h.length===1){h="",D=0,I=J,$=0;continue}}g&&(h.length>0?h+="/..":h="..",D=2)}else h.length>0?h+="/"+T.slice(I+1,J):h=T.slice(I+1,J),D=J-I-1;I=J,$=0}else F===46&&$!==-1?++$:$=-1}return h}i(U,"normalizeStringPosix");function Y(T,g){var h=g.dir||g.root,D=g.base||(g.name||"")+(g.ext||"");return h?h===g.root?h+D:h+T+D:D}i(Y,"_format");var V={resolve:i(function(){for(var g="",h=!1,D,I=arguments.length-1;I>=-1&&!h;I--){var $;I>=0?$=arguments[I]:(D===void 0&&(D=process.cwd()),$=D),_($),$.length!==0&&(g=$+"/"+g,h=$.charCodeAt(0)===47)}return g=U(g,!h),h?g.length>0?"/"+g:"/":g.length>0?g:"."},"resolve"),normalize:i(function(g){if(_(g),g.length===0)return".";var h=g.charCodeAt(0)===47,D=g.charCodeAt(g.length-1)===47;return g=U(g,!h),g.length===0&&!h&&(g="."),g.length>0&&D&&(g+="/"),h?"/"+g:g},"normalize"),isAbsolute:i(function(g){return _(g),g.length>0&&g.charCodeAt(0)===47},"isAbsolute"),join:i(function(){if(arguments.length===0)return".";for(var g,h=0;h<arguments.length;++h){var D=arguments[h];_(D),D.length>0&&(g===void 0?g=D:g+="/"+D)}return g===void 0?".":V.normalize(g)},"join"),relative:i(function(g,h){if(_(g),_(h),g===h||(g=V.resolve(g),h=V.resolve(h),g===h))return"";for(var D=1;D<g.length&&g.charCodeAt(D)===47;++D);for(var I=g.length,$=I-D,F=1;F<h.length&&h.charCodeAt(F)===47;++F);for(var J=h.length,G=J-F,De=$<G?$:G,Ve=-1,me=0;me<=De;++me){if(me===De){if(G>De){if(h.charCodeAt(F+me)===47)return h.slice(F+me+1);if(me===0)return h.slice(F+me)}else $>De&&(g.charCodeAt(D+me)===47?Ve=me:me===0&&(Ve=0));break}var Ae=g.charCodeAt(D+me),nt=h.charCodeAt(F+me);if(Ae!==nt)break;Ae===47&&(Ve=me)}var W="";for(me=D+Ve+1;me<=I;++me)(me===I||g.charCodeAt(me)===47)&&(W.length===0?W+="..":W+="/..");return W.length>0?W+h.slice(F+Ve):(F+=Ve,h.charCodeAt(F)===47&&++F,h.slice(F))},"relative"),_makeLong:i(function(g){return g},"_makeLong"),dirname:i(function(g){if(_(g),g.length===0)return".";for(var h=g.charCodeAt(0),D=h===47,I=-1,$=!0,F=g.length-1;F>=1;--F)if(h=g.charCodeAt(F),h===47){if(!$){I=F;break}}else $=!1;return I===-1?D?"/":".":D&&I===1?"//":g.slice(0,I)},"dirname"),basename:i(function(g,h){if(h!==void 0&&typeof h!="string")throw new TypeError('"ext" argument must be a string');_(g);var D=0,I=-1,$=!0,F;if(h!==void 0&&h.length>0&&h.length<=g.length){if(h.length===g.length&&h===g)return"";var J=h.length-1,G=-1;for(F=g.length-1;F>=0;--F){var De=g.charCodeAt(F);if(De===47){if(!$){D=F+1;break}}else G===-1&&($=!1,G=F+1),J>=0&&(De===h.charCodeAt(J)?--J===-1&&(I=F):(J=-1,I=G))}return D===I?I=G:I===-1&&(I=g.length),g.slice(D,I)}else{for(F=g.length-1;F>=0;--F)if(g.charCodeAt(F)===47){if(!$){D=F+1;break}}else I===-1&&($=!1,I=F+1);return I===-1?"":g.slice(D,I)}},"basename"),extname:i(function(g){_(g);for(var h=-1,D=0,I=-1,$=!0,F=0,J=g.length-1;J>=0;--J){var G=g.charCodeAt(J);if(G===47){if(!$){D=J+1;break}continue}I===-1&&($=!1,I=J+1),G===46?h===-1?h=J:F!==1&&(F=1):h!==-1&&(F=-1)}return h===-1||I===-1||F===0||F===1&&h===I-1&&h===D+1?"":g.slice(h,I)},"extname"),format:i(function(g){if(g===null||typeof g!="object")throw new TypeError('The "pathObject" argument must be of type Object. Received type '+typeof g);return Y("/",g)},"format"),parse:i(function(g){_(g);var h={root:"",dir:"",base:"",ext:"",name:""};if(g.length===0)return h;var D=g.charCodeAt(0),I=D===47,$;I?(h.root="/",$=1):$=0;for(var F=-1,J=0,G=-1,De=!0,Ve=g.length-1,me=0;Ve>=$;--Ve){if(D=g.charCodeAt(Ve),D===47){if(!De){J=Ve+1;break}continue}G===-1&&(De=!1,G=Ve+1),D===46?F===-1?F=Ve:me!==1&&(me=1):F!==-1&&(me=-1)}return F===-1||G===-1||me===0||me===1&&F===G-1&&F===J+1?G!==-1&&(J===0&&I?h.base=h.name=g.slice(1,G):h.base=h.name=g.slice(J,G)):(J===0&&I?(h.name=g.slice(1,F),h.base=g.slice(1,G)):(h.name=g.slice(J,F),h.base=g.slice(J,G)),h.ext=g.slice(F,G)),J>0?h.dir=g.slice(0,J-1):I&&(h.dir="/"),h},"parse"),sep:"/",delimiter:":",win32:null,posix:null};V.posix=V,k.exports=V},22551:(k,_,U)=>{"use strict";var Y;/** @license React v16.14.0
 * react-dom.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var V=U(96540),T=U(45228),g=U(69982);function h(e){for(var t="https://reactjs.org/docs/error-decoder.html?invariant="+e,n=1;n<arguments.length;n++)t+="&args[]="+encodeURIComponent(arguments[n]);return"Minified React error #"+e+"; visit "+t+" for the full message or use the non-minified dev environment for full errors and additional helpful warnings."}if(i(h,"u"),!V)throw Error(h(227));function D(e,t,n,r,s,d,m,v,L){var S=Array.prototype.slice.call(arguments,3);try{t.apply(n,S)}catch(ne){this.onError(ne)}}i(D,"ba");var I=!1,$=null,F=!1,J=null,G={onError:i(function(e){I=!0,$=e},"onError")};function De(e,t,n,r,s,d,m,v,L){I=!1,$=null,D.apply(G,arguments)}i(De,"ja");function Ve(e,t,n,r,s,d,m,v,L){if(De.apply(this,arguments),I){if(I){var S=$;I=!1,$=null}else throw Error(h(198));F||(F=!0,J=S)}}i(Ve,"ka");var me=null,Ae=null,nt=null;function W(e,t,n){var r=e.type||"unknown-event";e.currentTarget=nt(n),Ve(r,t,void 0,e),e.currentTarget=null}i(W,"oa");var N=null,l={};function ie(){if(N)for(var e in l){var t=l[e],n=N.indexOf(e);if(!(-1<n))throw Error(h(96,e));if(!Z[n]){if(!t.extractEvents)throw Error(h(97,e));Z[n]=t,n=t.eventTypes;for(var r in n){var s=void 0,d=n[r],m=t,v=r;if(O.hasOwnProperty(v))throw Error(h(99,v));O[v]=d;var L=d.phasedRegistrationNames;if(L){for(s in L)L.hasOwnProperty(s)&&Q(L[s],m,v);s=!0}else d.registrationName?(Q(d.registrationName,m,v),s=!0):s=!1;if(!s)throw Error(h(98,r,e))}}}}i(ie,"ra");function Q(e,t,n){if(H[e])throw Error(h(100,e));H[e]=t,re[e]=t.eventTypes[n].dependencies}i(Q,"ua");var Z=[],O={},H={},re={};function X(e){var t=!1,n;for(n in e)if(e.hasOwnProperty(n)){var r=e[n];if(!l.hasOwnProperty(n)||l[n]!==r){if(l[n])throw Error(h(102,n));l[n]=r,t=!0}}t&&ie()}i(X,"xa");var ue=!(typeof window=="undefined"||typeof window.document=="undefined"||typeof window.document.createElement=="undefined"),he=null,ve=null,Ce=null;function He(e){if(e=Ae(e)){if(typeof he!="function")throw Error(h(280));var t=e.stateNode;t&&(t=me(t),he(e.stateNode,e.type,t))}}i(He,"Ca");function ze(e){ve?Ce?Ce.push(e):Ce=[e]:ve=e}i(ze,"Da");function oe(){if(ve){var e=ve,t=Ce;if(Ce=ve=null,He(e),t)for(e=0;e<t.length;e++)He(t[e])}}i(oe,"Ea");function Qe(e,t){return e(t)}i(Qe,"Fa");function at(e,t,n,r,s){return e(t,n,r,s)}i(at,"Ga");function wt(){}i(wt,"Ha");var be=Qe,qe=!1,B=!1;function K(){(ve!==null||Ce!==null)&&(wt(),oe())}i(K,"La");function de(e,t,n){if(B)return e(t,n);B=!0;try{return be(e,t,n)}finally{B=!1,K()}}i(de,"Ma");var w=/^[:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD][:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\-.0-9\u00B7\u0300-\u036F\u203F-\u2040]*$/,P=Object.prototype.hasOwnProperty,ge={},Le={};function ke(e){return P.call(Le,e)?!0:P.call(ge,e)?!1:w.test(e)?Le[e]=!0:(ge[e]=!0,!1)}i(ke,"Ra");function Be(e,t,n,r){if(n!==null&&n.type===0)return!1;switch(typeof t){case"function":case"symbol":return!0;case"boolean":return r?!1:n!==null?!n.acceptsBooleans:(e=e.toLowerCase().slice(0,5),e!=="data-"&&e!=="aria-");default:return!1}}i(Be,"Sa");function bt(e,t,n,r){if(t===null||typeof t=="undefined"||Be(e,t,n,r))return!0;if(r)return!1;if(n!==null)switch(n.type){case 3:return!t;case 4:return t===!1;case 5:return isNaN(t);case 6:return isNaN(t)||1>t}return!1}i(bt,"Ta");function Me(e,t,n,r,s,d){this.acceptsBooleans=t===2||t===3||t===4,this.attributeName=r,this.attributeNamespace=s,this.mustUseProperty=n,this.propertyName=e,this.type=t,this.sanitizeURL=d}i(Me,"v");var we={};"children dangerouslySetInnerHTML defaultValue defaultChecked innerHTML suppressContentEditableWarning suppressHydrationWarning style".split(" ").forEach(function(e){we[e]=new Me(e,0,!1,e,null,!1)}),[["acceptCharset","accept-charset"],["className","class"],["htmlFor","for"],["httpEquiv","http-equiv"]].forEach(function(e){var t=e[0];we[t]=new Me(t,1,!1,e[1],null,!1)}),["contentEditable","draggable","spellCheck","value"].forEach(function(e){we[e]=new Me(e,2,!1,e.toLowerCase(),null,!1)}),["autoReverse","externalResourcesRequired","focusable","preserveAlpha"].forEach(function(e){we[e]=new Me(e,2,!1,e,null,!1)}),"allowFullScreen async autoFocus autoPlay controls default defer disabled disablePictureInPicture formNoValidate hidden loop noModule noValidate open playsInline readOnly required reversed scoped seamless itemScope".split(" ").forEach(function(e){we[e]=new Me(e,3,!1,e.toLowerCase(),null,!1)}),["checked","multiple","muted","selected"].forEach(function(e){we[e]=new Me(e,3,!0,e,null,!1)}),["capture","download"].forEach(function(e){we[e]=new Me(e,4,!1,e,null,!1)}),["cols","rows","size","span"].forEach(function(e){we[e]=new Me(e,6,!1,e,null,!1)}),["rowSpan","start"].forEach(function(e){we[e]=new Me(e,5,!1,e.toLowerCase(),null,!1)});var Pe=/[\-:]([a-z])/g;function to(e){return e[1].toUpperCase()}i(to,"Va"),"accent-height alignment-baseline arabic-form baseline-shift cap-height clip-path clip-rule color-interpolation color-interpolation-filters color-profile color-rendering dominant-baseline enable-background fill-opacity fill-rule flood-color flood-opacity font-family font-size font-size-adjust font-stretch font-style font-variant font-weight glyph-name glyph-orientation-horizontal glyph-orientation-vertical horiz-adv-x horiz-origin-x image-rendering letter-spacing lighting-color marker-end marker-mid marker-start overline-position overline-thickness paint-order panose-1 pointer-events rendering-intent shape-rendering stop-color stop-opacity strikethrough-position strikethrough-thickness stroke-dasharray stroke-dashoffset stroke-linecap stroke-linejoin stroke-miterlimit stroke-opacity stroke-width text-anchor text-decoration text-rendering underline-position underline-thickness unicode-bidi unicode-range units-per-em v-alphabetic v-hanging v-ideographic v-mathematical vector-effect vert-adv-y vert-origin-x vert-origin-y word-spacing writing-mode xmlns:xlink x-height".split(" ").forEach(function(e){var t=e.replace(Pe,to);we[t]=new Me(t,1,!1,e,null,!1)}),"xlink:actuate xlink:arcrole xlink:role xlink:show xlink:title xlink:type".split(" ").forEach(function(e){var t=e.replace(Pe,to);we[t]=new Me(t,1,!1,e,"http://www.w3.org/1999/xlink",!1)}),["xml:base","xml:lang","xml:space"].forEach(function(e){var t=e.replace(Pe,to);we[t]=new Me(t,1,!1,e,"http://www.w3.org/XML/1998/namespace",!1)}),["tabIndex","crossOrigin"].forEach(function(e){we[e]=new Me(e,1,!1,e.toLowerCase(),null,!1)}),we.xlinkHref=new Me("xlinkHref",1,!1,"xlink:href","http://www.w3.org/1999/xlink",!0),["src","href","action","formAction"].forEach(function(e){we[e]=new Me(e,1,!1,e.toLowerCase(),null,!0)});var _t=V.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;_t.hasOwnProperty("ReactCurrentDispatcher")||(_t.ReactCurrentDispatcher={current:null}),_t.hasOwnProperty("ReactCurrentBatchConfig")||(_t.ReactCurrentBatchConfig={suspense:null});function no(e,t,n,r){var s=we.hasOwnProperty(t)?we[t]:null,d=s!==null?s.type===0:r?!1:!(!(2<t.length)||t[0]!=="o"&&t[0]!=="O"||t[1]!=="n"&&t[1]!=="N");d||(bt(t,n,s,r)&&(n=null),r||s===null?ke(t)&&(n===null?e.removeAttribute(t):e.setAttribute(t,""+n)):s.mustUseProperty?e[s.propertyName]=n===null?s.type===3?!1:"":n:(t=s.attributeName,r=s.attributeNamespace,n===null?e.removeAttribute(t):(s=s.type,n=s===3||s===4&&n===!0?"":""+n,r?e.setAttributeNS(r,t,n):e.setAttribute(t,n))))}i(no,"Xa");var ai=/^(.*)[\\\/]/,ut=typeof Symbol=="function"&&Symbol.for,Ee=ut?Symbol.for("react.element"):60103,Un=ut?Symbol.for("react.portal"):60106,qt=ut?Symbol.for("react.fragment"):60107,Wn=ut?Symbol.for("react.strict_mode"):60108,_r=ut?Symbol.for("react.profiler"):60114,ui=ut?Symbol.for("react.provider"):60109,ci=ut?Symbol.for("react.context"):60110,$l=ut?Symbol.for("react.concurrent_mode"):60111,ro=ut?Symbol.for("react.forward_ref"):60112,Lr=ut?Symbol.for("react.suspense"):60113,di=ut?Symbol.for("react.suspense_list"):60120,oo=ut?Symbol.for("react.memo"):60115,Sr=ut?Symbol.for("react.lazy"):60116,zl=ut?Symbol.for("react.block"):60121,fi=typeof Symbol=="function"&&Symbol.iterator;function qn(e){return e===null||typeof e!="object"?null:(e=fi&&e[fi]||e["@@iterator"],typeof e=="function"?e:null)}i(qn,"nb");function Bl(e){if(e._status===-1){e._status=0;var t=e._ctor;t=t(),e._result=t,t.then(function(n){e._status===0&&(n=n.default,e._status=1,e._result=n)},function(n){e._status===0&&(e._status=2,e._result=n)})}}i(Bl,"ob");function At(e){if(e==null)return null;if(typeof e=="function")return e.displayName||e.name||null;if(typeof e=="string")return e;switch(e){case qt:return"Fragment";case Un:return"Portal";case _r:return"Profiler";case Wn:return"StrictMode";case Lr:return"Suspense";case di:return"SuspenseList"}if(typeof e=="object")switch(e.$$typeof){case ci:return"Context.Consumer";case ui:return"Context.Provider";case ro:var t=e.render;return t=t.displayName||t.name||"",e.displayName||(t!==""?"ForwardRef("+t+")":"ForwardRef");case oo:return At(e.type);case zl:return At(e.render);case Sr:if(e=e._status===1?e._result:null)return At(e)}return null}i(At,"pb");function io(e){var t="";do{e:switch(e.tag){case 3:case 4:case 6:case 7:case 10:case 9:var n="";break e;default:var r=e._debugOwner,s=e._debugSource,d=At(e.type);n=null,r&&(n=At(r.type)),r=d,d="",s?d=" (at "+s.fileName.replace(ai,"")+":"+s.lineNumber+")":n&&(d=" (created by "+n+")"),n=`
    in `+(r||"Unknown")+d}t+=n,e=e.return}while(e);return t}i(io,"qb");function It(e){switch(typeof e){case"boolean":case"number":case"object":case"string":case"undefined":return e;default:return""}}i(It,"rb");function lo(e){var t=e.type;return(e=e.nodeName)&&e.toLowerCase()==="input"&&(t==="checkbox"||t==="radio")}i(lo,"sb");function mi(e){var t=lo(e)?"checked":"value",n=Object.getOwnPropertyDescriptor(e.constructor.prototype,t),r=""+e[t];if(!e.hasOwnProperty(t)&&typeof n!="undefined"&&typeof n.get=="function"&&typeof n.set=="function"){var s=n.get,d=n.set;return Object.defineProperty(e,t,{configurable:!0,get:i(function(){return s.call(this)},"get"),set:i(function(m){r=""+m,d.call(this,m)},"set")}),Object.defineProperty(e,t,{enumerable:n.enumerable}),{getValue:i(function(){return r},"getValue"),setValue:i(function(m){r=""+m},"setValue"),stopTracking:i(function(){e._valueTracker=null,delete e[t]},"stopTracking")}}}i(mi,"tb");function Tt(e){e._valueTracker||(e._valueTracker=mi(e))}i(Tt,"xb");function pi(e){if(!e)return!1;var t=e._valueTracker;if(!t)return!0;var n=t.getValue(),r="";return e&&(r=lo(e)?e.checked?"true":"false":e.value),e=r,e!==n?(t.setValue(e),!0):!1}i(pi,"yb");function hi(e,t){var n=t.checked;return T({},t,{defaultChecked:void 0,defaultValue:void 0,value:void 0,checked:n!=null?n:e._wrapperState.initialChecked})}i(hi,"zb");function jl(e,t){var n=t.defaultValue==null?"":t.defaultValue,r=t.checked!=null?t.checked:t.defaultChecked;n=It(t.value!=null?t.value:n),e._wrapperState={initialChecked:r,initialValue:n,controlled:t.type==="checkbox"||t.type==="radio"?t.checked!=null:t.value!=null}}i(jl,"Ab");function Ul(e,t){t=t.checked,t!=null&&no(e,"checked",t,!1)}i(Ul,"Bb");function vi(e,t){Ul(e,t);var n=It(t.value),r=t.type;if(n!=null)r==="number"?(n===0&&e.value===""||e.value!=n)&&(e.value=""+n):e.value!==""+n&&(e.value=""+n);else if(r==="submit"||r==="reset"){e.removeAttribute("value");return}t.hasOwnProperty("value")?gi(e,t.type,n):t.hasOwnProperty("defaultValue")&&gi(e,t.type,It(t.defaultValue)),t.checked==null&&t.defaultChecked!=null&&(e.defaultChecked=!!t.defaultChecked)}i(vi,"Cb");function Wl(e,t,n){if(t.hasOwnProperty("value")||t.hasOwnProperty("defaultValue")){var r=t.type;if(!(r!=="submit"&&r!=="reset"||t.value!==void 0&&t.value!==null))return;t=""+e._wrapperState.initialValue,n||t===e.value||(e.value=t),e.defaultValue=t}n=e.name,n!==""&&(e.name=""),e.defaultChecked=!!e._wrapperState.initialChecked,n!==""&&(e.name=n)}i(Wl,"Eb");function gi(e,t,n){(t!=="number"||e.ownerDocument.activeElement!==e)&&(n==null?e.defaultValue=""+e._wrapperState.initialValue:e.defaultValue!==""+n&&(e.defaultValue=""+n))}i(gi,"Db");function Ea(e){var t="";return V.Children.forEach(e,function(n){n!=null&&(t+=n)}),t}i(Ea,"Fb");function yi(e,t){return e=T({children:void 0},t),(t=Ea(t.children))&&(e.children=t),e}i(yi,"Gb");function Zn(e,t,n,r){if(e=e.options,t){t={};for(var s=0;s<n.length;s++)t["$"+n[s]]=!0;for(n=0;n<e.length;n++)s=t.hasOwnProperty("$"+e[n].value),e[n].selected!==s&&(e[n].selected=s),s&&r&&(e[n].defaultSelected=!0)}else{for(n=""+It(n),t=null,s=0;s<e.length;s++){if(e[s].value===n){e[s].selected=!0,r&&(e[s].defaultSelected=!0);return}t!==null||e[s].disabled||(t=e[s])}t!==null&&(t.selected=!0)}}i(Zn,"Hb");function Ci(e,t){if(t.dangerouslySetInnerHTML!=null)throw Error(h(91));return T({},t,{value:void 0,defaultValue:void 0,children:""+e._wrapperState.initialValue})}i(Ci,"Ib");function wi(e,t){var n=t.value;if(n==null){if(n=t.children,t=t.defaultValue,n!=null){if(t!=null)throw Error(h(92));if(Array.isArray(n)){if(!(1>=n.length))throw Error(h(93));n=n[0]}t=n}t==null&&(t=""),n=t}e._wrapperState={initialValue:It(n)}}i(wi,"Jb");function xi(e,t){var n=It(t.value),r=It(t.defaultValue);n!=null&&(n=""+n,n!==e.value&&(e.value=n),t.defaultValue==null&&e.defaultValue!==n&&(e.defaultValue=n)),r!=null&&(e.defaultValue=""+r)}i(xi,"Kb");function Ei(e){var t=e.textContent;t===e._wrapperState.initialValue&&t!==""&&t!==null&&(e.value=t)}i(Ei,"Lb");var bi={html:"http://www.w3.org/1999/xhtml",mathml:"http://www.w3.org/1998/Math/MathML",svg:"http://www.w3.org/2000/svg"};function ki(e){switch(e){case"svg":return"http://www.w3.org/2000/svg";case"math":return"http://www.w3.org/1998/Math/MathML";default:return"http://www.w3.org/1999/xhtml"}}i(ki,"Nb");function so(e,t){return e==null||e==="http://www.w3.org/1999/xhtml"?ki(t):e==="http://www.w3.org/2000/svg"&&t==="foreignObject"?"http://www.w3.org/1999/xhtml":e}i(so,"Ob");var ln,_i=function(e){return typeof MSApp!="undefined"&&MSApp.execUnsafeLocalFunction?function(t,n,r,s){MSApp.execUnsafeLocalFunction(function(){return e(t,n,r,s)})}:e}(function(e,t){if(e.namespaceURI!==bi.svg||"innerHTML"in e)e.innerHTML=t;else{for(ln=ln||document.createElement("div"),ln.innerHTML="<svg>"+t.valueOf().toString()+"</svg>",t=ln.firstChild;e.firstChild;)e.removeChild(e.firstChild);for(;t.firstChild;)e.appendChild(t.firstChild)}});function Qn(e,t){if(t){var n=e.firstChild;if(n&&n===e.lastChild&&n.nodeType===3){n.nodeValue=t;return}}e.textContent=t}i(Qn,"Rb");function Tr(e,t){var n={};return n[e.toLowerCase()]=t.toLowerCase(),n["Webkit"+e]="webkit"+t,n["Moz"+e]="moz"+t,n}i(Tr,"Sb");var wn={animationend:Tr("Animation","AnimationEnd"),animationiteration:Tr("Animation","AnimationIteration"),animationstart:Tr("Animation","AnimationStart"),transitionend:Tr("Transition","TransitionEnd")},Kn={},rt={};ue&&(rt=document.createElement("div").style,"AnimationEvent"in window||(delete wn.animationend.animation,delete wn.animationiteration.animation,delete wn.animationstart.animation),"TransitionEvent"in window||delete wn.transitionend.transition);function Mr(e){if(Kn[e])return Kn[e];if(!wn[e])return e;var t=wn[e],n;for(n in t)if(t.hasOwnProperty(n)&&n in rt)return Kn[e]=t[n];return e}i(Mr,"Wb");var ql=Mr("animationend"),Li=Mr("animationiteration"),Yn=Mr("animationstart"),Si=Mr("transitionend"),Gn="abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange seeked seeking stalled suspend timeupdate volumechange waiting".split(" "),Ti=new(typeof WeakMap=="function"?WeakMap:Map);function ao(e){var t=Ti.get(e);return t===void 0&&(t=new Map,Ti.set(e,t)),t}i(ao,"cc");function sn(e){var t=e,n=e;if(e.alternate)for(;t.return;)t=t.return;else{e=t;do t=e,t.effectTag&1026&&(n=t.return),e=t.return;while(e)}return t.tag===3?n:null}i(sn,"dc");function Mi(e){if(e.tag===13){var t=e.memoizedState;if(t===null&&(e=e.alternate,e!==null&&(t=e.memoizedState)),t!==null)return t.dehydrated}return null}i(Mi,"ec");function uo(e){if(sn(e)!==e)throw Error(h(188))}i(uo,"fc");function Zl(e){var t=e.alternate;if(!t){if(t=sn(e),t===null)throw Error(h(188));return t!==e?null:e}for(var n=e,r=t;;){var s=n.return;if(s===null)break;var d=s.alternate;if(d===null){if(r=s.return,r!==null){n=r;continue}break}if(s.child===d.child){for(d=s.child;d;){if(d===n)return uo(s),e;if(d===r)return uo(s),t;d=d.sibling}throw Error(h(188))}if(n.return!==r.return)n=s,r=d;else{for(var m=!1,v=s.child;v;){if(v===n){m=!0,n=s,r=d;break}if(v===r){m=!0,r=s,n=d;break}v=v.sibling}if(!m){for(v=d.child;v;){if(v===n){m=!0,n=d,r=s;break}if(v===r){m=!0,r=d,n=s;break}v=v.sibling}if(!m)throw Error(h(189))}}if(n.alternate!==r)throw Error(h(190))}if(n.tag!==3)throw Error(h(188));return n.stateNode.current===n?e:t}i(Zl,"gc");function Ql(e){if(e=Zl(e),!e)return null;for(var t=e;;){if(t.tag===5||t.tag===6)return t;if(t.child)t.child.return=t,t=t.child;else{if(t===e)break;for(;!t.sibling;){if(!t.return||t.return===e)return null;t=t.return}t.sibling.return=t.return,t=t.sibling}}return null}i(Ql,"hc");function an(e,t){if(t==null)throw Error(h(30));return e==null?t:Array.isArray(e)?Array.isArray(t)?(e.push.apply(e,t),e):(e.push(t),e):Array.isArray(t)?[e].concat(t):[e,t]}i(an,"ic");function Ni(e,t,n){Array.isArray(e)?e.forEach(t,n):e&&t.call(n,e)}i(Ni,"jc");var xn=null;function Kl(e){if(e){var t=e._dispatchListeners,n=e._dispatchInstances;if(Array.isArray(t))for(var r=0;r<t.length&&!e.isPropagationStopped();r++)W(e,t[r],n[r]);else t&&W(e,t,n);e._dispatchListeners=null,e._dispatchInstances=null,e.isPersistent()||e.constructor.release(e)}}i(Kl,"lc");function Nr(e){if(e!==null&&(xn=an(xn,e)),e=xn,xn=null,e){if(Ni(e,Kl),xn)throw Error(h(95));if(F)throw e=J,F=!1,J=null,e}}i(Nr,"mc");function Xe(e){return e=e.target||e.srcElement||window,e.correspondingUseElement&&(e=e.correspondingUseElement),e.nodeType===3?e.parentNode:e}i(Xe,"nc");function Yl(e){if(!ue)return!1;e="on"+e;var t=e in document;return t||(t=document.createElement("div"),t.setAttribute(e,"return;"),t=typeof t[e]=="function"),t}i(Yl,"oc");var co=[];function Gl(e){e.topLevelType=null,e.nativeEvent=null,e.targetInst=null,e.ancestors.length=0,10>co.length&&co.push(e)}i(Gl,"qc");function Xl(e,t,n,r){if(co.length){var s=co.pop();return s.topLevelType=e,s.eventSystemFlags=r,s.nativeEvent=t,s.targetInst=n,s}return{topLevelType:e,eventSystemFlags:r,nativeEvent:t,targetInst:n,ancestors:[]}}i(Xl,"rc");function Ri(e){var t=e.targetInst,n=t;do{if(!n){e.ancestors.push(n);break}var r=n;if(r.tag===3)r=r.stateNode.containerInfo;else{for(;r.return;)r=r.return;r=r.tag!==3?null:r.stateNode.containerInfo}if(!r)break;t=n.tag,t!==5&&t!==6||e.ancestors.push(n),n=Qt(r)}while(n);for(n=0;n<e.ancestors.length;n++){t=e.ancestors[n];var s=Xe(e.nativeEvent);r=e.topLevelType;var d=e.nativeEvent,m=e.eventSystemFlags;n===0&&(m|=64);for(var v=null,L=0;L<Z.length;L++){var S=Z[L];S&&(S=S.extractEvents(r,t,d,s,m))&&(v=an(v,S))}Nr(v)}}i(Ri,"sc");function Pi(e,t,n){if(!n.has(e)){switch(e){case"scroll":it(t,"scroll",!0);break;case"focus":case"blur":it(t,"focus",!0),it(t,"blur",!0),n.set("blur",null),n.set("focus",null);break;case"cancel":case"close":Yl(e)&&it(t,e,!0);break;case"invalid":case"submit":case"reset":break;default:Gn.indexOf(e)===-1&&Ke(e,t)}n.set(e,null)}}i(Pi,"uc");var fo,Xn,Oi,mo=!1,zt=[],un=null,cn=null,Mt=null,Ht=new Map,En=new Map,bn=[],po="mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput close cancel copy cut paste click change contextmenu reset submit".split(" "),Di="focus blur dragenter dragleave mouseover mouseout pointerover pointerout gotpointercapture lostpointercapture".split(" ");function Jl(e,t){var n=ao(t);po.forEach(function(r){Pi(r,t,n)}),Di.forEach(function(r){Pi(r,t,n)})}i(Jl,"Jc");function ho(e,t,n,r,s){return{blockedOn:e,topLevelType:t,eventSystemFlags:n|32,nativeEvent:s,container:r}}i(ho,"Kc");function vo(e,t){switch(e){case"focus":case"blur":un=null;break;case"dragenter":case"dragleave":cn=null;break;case"mouseover":case"mouseout":Mt=null;break;case"pointerover":case"pointerout":Ht.delete(t.pointerId);break;case"gotpointercapture":case"lostpointercapture":En.delete(t.pointerId)}}i(vo,"Lc");function dn(e,t,n,r,s,d){return e===null||e.nativeEvent!==d?(e=ho(t,n,r,s,d),t!==null&&(t=ir(t),t!==null&&Xn(t)),e):(e.eventSystemFlags|=r,e)}i(dn,"Mc");function Ai(e,t,n,r,s){switch(t){case"focus":return un=dn(un,e,t,n,r,s),!0;case"dragenter":return cn=dn(cn,e,t,n,r,s),!0;case"mouseover":return Mt=dn(Mt,e,t,n,r,s),!0;case"pointerover":var d=s.pointerId;return Ht.set(d,dn(Ht.get(d)||null,e,t,n,r,s)),!0;case"gotpointercapture":return d=s.pointerId,En.set(d,dn(En.get(d)||null,e,t,n,r,s)),!0}return!1}i(Ai,"Oc");function go(e){var t=Qt(e.target);if(t!==null){var n=sn(t);if(n!==null){if(t=n.tag,t===13){if(t=Mi(n),t!==null){e.blockedOn=t,g.unstable_runWithPriority(e.priority,function(){Oi(n)});return}}else if(t===3&&n.stateNode.hydrate){e.blockedOn=n.tag===3?n.stateNode.containerInfo:null;return}}}e.blockedOn=null}i(go,"Pc");function Jn(e){if(e.blockedOn!==null)return!1;var t=_n(e.topLevelType,e.eventSystemFlags,e.container,e.nativeEvent);if(t!==null){var n=ir(t);return n!==null&&Xn(n),e.blockedOn=t,!1}return!0}i(Jn,"Qc");function yo(e,t,n){Jn(e)&&n.delete(t)}i(yo,"Sc");function Co(){for(mo=!1;0<zt.length;){var e=zt[0];if(e.blockedOn!==null){e=ir(e.blockedOn),e!==null&&fo(e);break}var t=_n(e.topLevelType,e.eventSystemFlags,e.container,e.nativeEvent);t!==null?e.blockedOn=t:zt.shift()}un!==null&&Jn(un)&&(un=null),cn!==null&&Jn(cn)&&(cn=null),Mt!==null&&Jn(Mt)&&(Mt=null),Ht.forEach(yo),En.forEach(yo)}i(Co,"Tc");function fn(e,t){e.blockedOn===t&&(e.blockedOn=null,mo||(mo=!0,g.unstable_scheduleCallback(g.unstable_NormalPriority,Co)))}i(fn,"Uc");function er(e){function t(s){return fn(s,e)}if(i(t,"b"),0<zt.length){fn(zt[0],e);for(var n=1;n<zt.length;n++){var r=zt[n];r.blockedOn===e&&(r.blockedOn=null)}}for(un!==null&&fn(un,e),cn!==null&&fn(cn,e),Mt!==null&&fn(Mt,e),Ht.forEach(t),En.forEach(t),n=0;n<bn.length;n++)r=bn[n],r.blockedOn===e&&(r.blockedOn=null);for(;0<bn.length&&(n=bn[0],n.blockedOn===null);)go(n),n.blockedOn===null&&bn.shift()}i(er,"Vc");var Ii={},Rr=new Map,Hi=new Map,kn=["abort","abort",ql,"animationEnd",Li,"animationIteration",Yn,"animationStart","canplay","canPlay","canplaythrough","canPlayThrough","durationchange","durationChange","emptied","emptied","encrypted","encrypted","ended","ended","error","error","gotpointercapture","gotPointerCapture","load","load","loadeddata","loadedData","loadedmetadata","loadedMetadata","loadstart","loadStart","lostpointercapture","lostPointerCapture","playing","playing","progress","progress","seeking","seeking","stalled","stalled","suspend","suspend","timeupdate","timeUpdate",Si,"transitionEnd","waiting","waiting"];function Pr(e,t){for(var n=0;n<e.length;n+=2){var r=e[n],s=e[n+1],d="on"+(s[0].toUpperCase()+s.slice(1));d={phasedRegistrationNames:{bubbled:d,captured:d+"Capture"},dependencies:[r],eventPriority:t},Hi.set(r,t),Rr.set(r,d),Ii[s]=d}}i(Pr,"ad"),Pr("blur blur cancel cancel click click close close contextmenu contextMenu copy copy cut cut auxclick auxClick dblclick doubleClick dragend dragEnd dragstart dragStart drop drop focus focus input input invalid invalid keydown keyDown keypress keyPress keyup keyUp mousedown mouseDown mouseup mouseUp paste paste pause pause play play pointercancel pointerCancel pointerdown pointerDown pointerup pointerUp ratechange rateChange reset reset seeked seeked submit submit touchcancel touchCancel touchend touchEnd touchstart touchStart volumechange volumeChange".split(" "),0),Pr("drag drag dragenter dragEnter dragexit dragExit dragleave dragLeave dragover dragOver mousemove mouseMove mouseout mouseOut mouseover mouseOver pointermove pointerMove pointerout pointerOut pointerover pointerOver scroll scroll toggle toggle touchmove touchMove wheel wheel".split(" "),1),Pr(kn,2);for(var es="change selectionchange textInput compositionstart compositionend compositionupdate".split(" "),Fi=0;Fi<es.length;Fi++)Hi.set(es[Fi],0);var ba=g.unstable_UserBlockingPriority,Nt=g.unstable_runWithPriority,wo=!0;function Ke(e,t){it(t,e,!1)}i(Ke,"F");function it(e,t,n){var r=Hi.get(t);switch(r===void 0?2:r){case 0:r=vt.bind(null,t,1,e);break;case 1:r=ts.bind(null,t,1,e);break;default:r=mn.bind(null,t,1,e)}n?e.addEventListener(t,r,!0):e.addEventListener(t,r,!1)}i(it,"vc");function vt(e,t,n,r){qe||wt();var s=mn,d=qe;qe=!0;try{at(s,e,t,n,r)}finally{(qe=d)||K()}}i(vt,"gd");function ts(e,t,n,r){Nt(ba,mn.bind(null,e,t,n,r))}i(ts,"hd");function mn(e,t,n,r){if(wo)if(0<zt.length&&-1<po.indexOf(e))e=ho(null,e,t,n,r),zt.push(e);else{var s=_n(e,t,n,r);if(s===null)vo(e,r);else if(-1<po.indexOf(e))e=ho(s,e,t,n,r),zt.push(e);else if(!Ai(s,e,t,n,r)){vo(e,r),e=Xl(e,r,null,t);try{de(Ri,e)}finally{Gl(e)}}}}i(mn,"id");function _n(e,t,n,r){if(n=Xe(r),n=Qt(n),n!==null){var s=sn(n);if(s===null)n=null;else{var d=s.tag;if(d===13){if(n=Mi(s),n!==null)return n;n=null}else if(d===3){if(s.stateNode.hydrate)return s.tag===3?s.stateNode.containerInfo:null;n=null}else s!==n&&(n=null)}}e=Xl(e,r,n,t);try{de(Ri,e)}finally{Gl(e)}return null}i(_n,"Rc");var tr={animationIterationCount:!0,borderImageOutset:!0,borderImageSlice:!0,borderImageWidth:!0,boxFlex:!0,boxFlexGroup:!0,boxOrdinalGroup:!0,columnCount:!0,columns:!0,flex:!0,flexGrow:!0,flexPositive:!0,flexShrink:!0,flexNegative:!0,flexOrder:!0,gridArea:!0,gridRow:!0,gridRowEnd:!0,gridRowSpan:!0,gridRowStart:!0,gridColumn:!0,gridColumnEnd:!0,gridColumnSpan:!0,gridColumnStart:!0,fontWeight:!0,lineClamp:!0,lineHeight:!0,opacity:!0,order:!0,orphans:!0,tabSize:!0,widows:!0,zIndex:!0,zoom:!0,fillOpacity:!0,floodOpacity:!0,stopOpacity:!0,strokeDasharray:!0,strokeDashoffset:!0,strokeMiterlimit:!0,strokeOpacity:!0,strokeWidth:!0},ns=["Webkit","ms","Moz","O"];Object.keys(tr).forEach(function(e){ns.forEach(function(t){t=t+e.charAt(0).toUpperCase()+e.substring(1),tr[t]=tr[e]})});function Vi(e,t,n){return t==null||typeof t=="boolean"||t===""?"":n||typeof t!="number"||t===0||tr.hasOwnProperty(e)&&tr[e]?(""+t).trim():t+"px"}i(Vi,"ld");function xo(e,t){e=e.style;for(var n in t)if(t.hasOwnProperty(n)){var r=n.indexOf("--")===0,s=Vi(n,t[n],r);n==="float"&&(n="cssFloat"),r?e.setProperty(n,s):e[n]=s}}i(xo,"md");var rs=T({menuitem:!0},{area:!0,base:!0,br:!0,col:!0,embed:!0,hr:!0,img:!0,input:!0,keygen:!0,link:!0,meta:!0,param:!0,source:!0,track:!0,wbr:!0});function Eo(e,t){if(t){if(rs[e]&&(t.children!=null||t.dangerouslySetInnerHTML!=null))throw Error(h(137,e,""));if(t.dangerouslySetInnerHTML!=null){if(t.children!=null)throw Error(h(60));if(!(typeof t.dangerouslySetInnerHTML=="object"&&"__html"in t.dangerouslySetInnerHTML))throw Error(h(61))}if(t.style!=null&&typeof t.style!="object")throw Error(h(62,""))}}i(Eo,"od");function bo(e,t){if(e.indexOf("-")===-1)return typeof t.is=="string";switch(e){case"annotation-xml":case"color-profile":case"font-face":case"font-face-src":case"font-face-uri":case"font-face-format":case"font-face-name":case"missing-glyph":return!1;default:return!0}}i(bo,"pd");var $i=bi.html;function Ft(e,t){e=e.nodeType===9||e.nodeType===11?e:e.ownerDocument;var n=ao(e);t=re[t];for(var r=0;r<t.length;r++)Pi(t[r],e,n)}i(Ft,"rd");function nr(){}i(nr,"sd");function rr(e){if(e=e||(typeof document!="undefined"?document:void 0),typeof e=="undefined")return null;try{return e.activeElement||e.body}catch{return e.body}}i(rr,"td");function ko(e){for(;e&&e.firstChild;)e=e.firstChild;return e}i(ko,"ud");function os(e,t){var n=ko(e);e=0;for(var r;n;){if(n.nodeType===3){if(r=e+n.textContent.length,e<=t&&r>=t)return{node:n,offset:t-e};e=r}e:{for(;n;){if(n.nextSibling){n=n.nextSibling;break e}n=n.parentNode}n=void 0}n=ko(n)}}i(os,"vd");function _o(e,t){return e&&t?e===t?!0:e&&e.nodeType===3?!1:t&&t.nodeType===3?_o(e,t.parentNode):"contains"in e?e.contains(t):e.compareDocumentPosition?!!(e.compareDocumentPosition(t)&16):!1:!1}i(_o,"wd");function is(){for(var e=window,t=rr();t instanceof e.HTMLIFrameElement;){try{var n=typeof t.contentWindow.location.href=="string"}catch{n=!1}if(n)e=t.contentWindow;else break;t=rr(e.document)}return t}i(is,"xd");function Lo(e){var t=e&&e.nodeName&&e.nodeName.toLowerCase();return t&&(t==="input"&&(e.type==="text"||e.type==="search"||e.type==="tel"||e.type==="url"||e.type==="password")||t==="textarea"||e.contentEditable==="true")}i(Lo,"yd");var Ln="$",Or="/$",So="$?",To="$!",Mo=null,No=null;function zi(e,t){switch(e){case"button":case"input":case"select":case"textarea":return!!t.autoFocus}return!1}i(zi,"Fd");function Ro(e,t){return e==="textarea"||e==="option"||e==="noscript"||typeof t.children=="string"||typeof t.children=="number"||typeof t.dangerouslySetInnerHTML=="object"&&t.dangerouslySetInnerHTML!==null&&t.dangerouslySetInnerHTML.__html!=null}i(Ro,"Gd");var Po=typeof setTimeout=="function"?setTimeout:void 0,ls=typeof clearTimeout=="function"?clearTimeout:void 0;function Sn(e){for(;e!=null;e=e.nextSibling){var t=e.nodeType;if(t===1||t===3)break}return e}i(Sn,"Jd");function Oo(e){e=e.previousSibling;for(var t=0;e;){if(e.nodeType===8){var n=e.data;if(n===Ln||n===To||n===So){if(t===0)return e;t--}else n===Or&&t++}e=e.previousSibling}return null}i(Oo,"Kd");var Do=Math.random().toString(36).slice(2),Zt="__reactInternalInstance$"+Do,Dr="__reactEventHandlers$"+Do,or="__reactContainere$"+Do;function Qt(e){var t=e[Zt];if(t)return t;for(var n=e.parentNode;n;){if(t=n[or]||n[Zt]){if(n=t.alternate,t.child!==null||n!==null&&n.child!==null)for(e=Oo(e);e!==null;){if(n=e[Zt])return n;e=Oo(e)}return t}e=n,n=e.parentNode}return null}i(Qt,"tc");function ir(e){return e=e[Zt]||e[or],!e||e.tag!==5&&e.tag!==6&&e.tag!==13&&e.tag!==3?null:e}i(ir,"Nc");function pn(e){if(e.tag===5||e.tag===6)return e.stateNode;throw Error(h(33))}i(pn,"Pd");function Ao(e){return e[Dr]||null}i(Ao,"Qd");function Bt(e){do e=e.return;while(e&&e.tag!==5);return e||null}i(Bt,"Rd");function Bi(e,t){var n=e.stateNode;if(!n)return null;var r=me(n);if(!r)return null;n=r[t];e:switch(t){case"onClick":case"onClickCapture":case"onDoubleClick":case"onDoubleClickCapture":case"onMouseDown":case"onMouseDownCapture":case"onMouseMove":case"onMouseMoveCapture":case"onMouseUp":case"onMouseUpCapture":case"onMouseEnter":(r=!r.disabled)||(e=e.type,r=!(e==="button"||e==="input"||e==="select"||e==="textarea")),e=!r;break e;default:e=!1}if(e)return null;if(n&&typeof n!="function")throw Error(h(231,t,typeof n));return n}i(Bi,"Sd");function ot(e,t,n){(t=Bi(e,n.dispatchConfig.phasedRegistrationNames[t]))&&(n._dispatchListeners=an(n._dispatchListeners,t),n._dispatchInstances=an(n._dispatchInstances,e))}i(ot,"Td");function Io(e){if(e&&e.dispatchConfig.phasedRegistrationNames){for(var t=e._targetInst,n=[];t;)n.push(t),t=Bt(t);for(t=n.length;0<t--;)ot(n[t],"captured",e);for(t=0;t<n.length;t++)ot(n[t],"bubbled",e)}}i(Io,"Ud");function Ho(e,t,n){e&&n&&n.dispatchConfig.registrationName&&(t=Bi(e,n.dispatchConfig.registrationName))&&(n._dispatchListeners=an(n._dispatchListeners,t),n._dispatchInstances=an(n._dispatchInstances,e))}i(Ho,"Vd");function ss(e){e&&e.dispatchConfig.registrationName&&Ho(e._targetInst,null,e)}i(ss,"Wd");function Tn(e){Ni(e,Io)}i(Tn,"Xd");var Kt=null,Fo=null,Ar=null;function ji(){if(Ar)return Ar;var e,t=Fo,n=t.length,r,s="value"in Kt?Kt.value:Kt.textContent,d=s.length;for(e=0;e<n&&t[e]===s[e];e++);var m=n-e;for(r=1;r<=m&&t[n-r]===s[d-r];r++);return Ar=s.slice(e,1<r?1-r:void 0)}i(ji,"ae");function Ir(){return!0}i(Ir,"be");function Hr(){return!1}i(Hr,"ce");function kt(e,t,n,r){this.dispatchConfig=e,this._targetInst=t,this.nativeEvent=n,e=this.constructor.Interface;for(var s in e)e.hasOwnProperty(s)&&((t=e[s])?this[s]=t(n):s==="target"?this.target=r:this[s]=n[s]);return this.isDefaultPrevented=(n.defaultPrevented!=null?n.defaultPrevented:n.returnValue===!1)?Ir:Hr,this.isPropagationStopped=Hr,this}i(kt,"G"),T(kt.prototype,{preventDefault:i(function(){this.defaultPrevented=!0;var e=this.nativeEvent;e&&(e.preventDefault?e.preventDefault():typeof e.returnValue!="unknown"&&(e.returnValue=!1),this.isDefaultPrevented=Ir)},"preventDefault"),stopPropagation:i(function(){var e=this.nativeEvent;e&&(e.stopPropagation?e.stopPropagation():typeof e.cancelBubble!="unknown"&&(e.cancelBubble=!0),this.isPropagationStopped=Ir)},"stopPropagation"),persist:i(function(){this.isPersistent=Ir},"persist"),isPersistent:Hr,destructor:i(function(){var e=this.constructor.Interface,t;for(t in e)this[t]=null;this.nativeEvent=this._targetInst=this.dispatchConfig=null,this.isPropagationStopped=this.isDefaultPrevented=Hr,this._dispatchInstances=this._dispatchListeners=null},"destructor")}),kt.Interface={type:null,target:null,currentTarget:i(function(){return null},"currentTarget"),eventPhase:null,bubbles:null,cancelable:null,timeStamp:i(function(e){return e.timeStamp||Date.now()},"timeStamp"),defaultPrevented:null,isTrusted:null},kt.extend=function(e){function t(){}i(t,"b");function n(){return r.apply(this,arguments)}i(n,"c");var r=this;t.prototype=r.prototype;var s=new t;return T(s,n.prototype),n.prototype=s,n.prototype.constructor=n,n.Interface=T({},r.Interface,e),n.extend=r.extend,Ui(n),n},Ui(kt);function as(e,t,n,r){if(this.eventPool.length){var s=this.eventPool.pop();return this.call(s,e,t,n,r),s}return new this(e,t,n,r)}i(as,"ee");function us(e){if(!(e instanceof this))throw Error(h(279));e.destructor(),10>this.eventPool.length&&this.eventPool.push(e)}i(us,"fe");function Ui(e){e.eventPool=[],e.getPooled=as,e.release=us}i(Ui,"de");var cs=kt.extend({data:null}),ka=kt.extend({data:null}),ds=[9,13,27,32],Vo=ue&&"CompositionEvent"in window,lr=null;ue&&"documentMode"in document&&(lr=document.documentMode);var fs=ue&&"TextEvent"in window&&!lr,Wi=ue&&(!Vo||lr&&8<lr&&11>=lr),ms=" ",jt={beforeInput:{phasedRegistrationNames:{bubbled:"onBeforeInput",captured:"onBeforeInputCapture"},dependencies:["compositionend","keypress","textInput","paste"]},compositionEnd:{phasedRegistrationNames:{bubbled:"onCompositionEnd",captured:"onCompositionEndCapture"},dependencies:"blur compositionend keydown keypress keyup mousedown".split(" ")},compositionStart:{phasedRegistrationNames:{bubbled:"onCompositionStart",captured:"onCompositionStartCapture"},dependencies:"blur compositionstart keydown keypress keyup mousedown".split(" ")},compositionUpdate:{phasedRegistrationNames:{bubbled:"onCompositionUpdate",captured:"onCompositionUpdateCapture"},dependencies:"blur compositionupdate keydown keypress keyup mousedown".split(" ")}},qi=!1;function Zi(e,t){switch(e){case"keyup":return ds.indexOf(t.keyCode)!==-1;case"keydown":return t.keyCode!==229;case"keypress":case"mousedown":case"blur":return!0;default:return!1}}i(Zi,"qe");function Qi(e){return e=e.detail,typeof e=="object"&&"data"in e?e.data:null}i(Qi,"re");var Mn=!1;function Fr(e,t){switch(e){case"compositionend":return Qi(t);case"keypress":return t.which!==32?null:(qi=!0,ms);case"textInput":return e=t.data,e===ms&&qi?null:e;default:return null}}i(Fr,"te");function Ki(e,t){if(Mn)return e==="compositionend"||!Vo&&Zi(e,t)?(e=ji(),Ar=Fo=Kt=null,Mn=!1,e):null;switch(e){case"paste":return null;case"keypress":if(!(t.ctrlKey||t.altKey||t.metaKey)||t.ctrlKey&&t.altKey){if(t.char&&1<t.char.length)return t.char;if(t.which)return String.fromCharCode(t.which)}return null;case"compositionend":return Wi&&t.locale!=="ko"?null:t.data;default:return null}}i(Ki,"ue");var ps={eventTypes:jt,extractEvents:i(function(e,t,n,r){var s;if(Vo)e:{switch(e){case"compositionstart":var d=jt.compositionStart;break e;case"compositionend":d=jt.compositionEnd;break e;case"compositionupdate":d=jt.compositionUpdate;break e}d=void 0}else Mn?Zi(e,n)&&(d=jt.compositionEnd):e==="keydown"&&n.keyCode===229&&(d=jt.compositionStart);return d?(Wi&&n.locale!=="ko"&&(Mn||d!==jt.compositionStart?d===jt.compositionEnd&&Mn&&(s=ji()):(Kt=r,Fo="value"in Kt?Kt.value:Kt.textContent,Mn=!0)),d=cs.getPooled(d,t,n,r),s?d.data=s:(s=Qi(n),s!==null&&(d.data=s)),Tn(d),s=d):s=null,(e=fs?Fr(e,n):Ki(e,n))?(t=ka.getPooled(jt.beforeInput,t,n,r),t.data=e,Tn(t)):t=null,s===null?t:t===null?s:[s,t]},"extractEvents")},hs={color:!0,date:!0,datetime:!0,"datetime-local":!0,email:!0,month:!0,number:!0,password:!0,range:!0,search:!0,tel:!0,text:!0,time:!0,url:!0,week:!0};function $o(e){var t=e&&e.nodeName&&e.nodeName.toLowerCase();return t==="input"?!!hs[e.type]:t==="textarea"}i($o,"xe");var Yi={change:{phasedRegistrationNames:{bubbled:"onChange",captured:"onChangeCapture"},dependencies:"blur change click focus input keydown keyup selectionchange".split(" ")}};function Gi(e,t,n){return e=kt.getPooled(Yi.change,e,t,n),e.type="change",ze(n),Tn(e),e}i(Gi,"ze");var sr=null,Vr=null;function ar(e){Nr(e)}i(ar,"Ce");function ur(e){var t=pn(e);if(pi(t))return e}i(ur,"De");function vs(e,t){if(e==="change")return t}i(vs,"Ee");var zo=!1;ue&&(zo=Yl("input")&&(!document.documentMode||9<document.documentMode));function Xi(){sr&&(sr.detachEvent("onpropertychange",Ji),Vr=sr=null)}i(Xi,"Ge");function Ji(e){if(e.propertyName==="value"&&ur(Vr))if(e=Gi(Vr,e,Xe(e)),qe)Nr(e);else{qe=!0;try{Qe(ar,e)}finally{qe=!1,K()}}}i(Ji,"He");function gs(e,t,n){e==="focus"?(Xi(),sr=t,Vr=n,sr.attachEvent("onpropertychange",Ji)):e==="blur"&&Xi()}i(gs,"Ie");function el(e){if(e==="selectionchange"||e==="keyup"||e==="keydown")return ur(Vr)}i(el,"Je");function tl(e,t){if(e==="click")return ur(t)}i(tl,"Ke");function ys(e,t){if(e==="input"||e==="change")return ur(t)}i(ys,"Le");var Cs={eventTypes:Yi,_isInputEventSupported:zo,extractEvents:i(function(e,t,n,r){var s=t?pn(t):window,d=s.nodeName&&s.nodeName.toLowerCase();if(d==="select"||d==="input"&&s.type==="file")var m=vs;else if($o(s))if(zo)m=ys;else{m=el;var v=gs}else(d=s.nodeName)&&d.toLowerCase()==="input"&&(s.type==="checkbox"||s.type==="radio")&&(m=tl);if(m&&(m=m(e,t)))return Gi(m,n,r);v&&v(e,s,t),e==="blur"&&(e=s._wrapperState)&&e.controlled&&s.type==="number"&&gi(s,"number",s.value)},"extractEvents")},cr=kt.extend({view:null,detail:null}),nl={Alt:"altKey",Control:"ctrlKey",Meta:"metaKey",Shift:"shiftKey"};function $r(e){var t=this.nativeEvent;return t.getModifierState?t.getModifierState(e):(e=nl[e])?!!t[e]:!1}i($r,"Pe");function Bo(){return $r}i(Bo,"Qe");var zr=0,jo=0,rl=!1,ol=!1,Nn=cr.extend({screenX:null,screenY:null,clientX:null,clientY:null,pageX:null,pageY:null,ctrlKey:null,shiftKey:null,altKey:null,metaKey:null,getModifierState:Bo,button:null,buttons:null,relatedTarget:i(function(e){return e.relatedTarget||(e.fromElement===e.srcElement?e.toElement:e.fromElement)},"relatedTarget"),movementX:i(function(e){if("movementX"in e)return e.movementX;var t=zr;return zr=e.screenX,rl?e.type==="mousemove"?e.screenX-t:0:(rl=!0,0)},"movementX"),movementY:i(function(e){if("movementY"in e)return e.movementY;var t=jo;return jo=e.screenY,ol?e.type==="mousemove"?e.screenY-t:0:(ol=!0,0)},"movementY")}),il=Nn.extend({pointerId:null,width:null,height:null,pressure:null,tangentialPressure:null,tiltX:null,tiltY:null,twist:null,pointerType:null,isPrimary:null}),Br={mouseEnter:{registrationName:"onMouseEnter",dependencies:["mouseout","mouseover"]},mouseLeave:{registrationName:"onMouseLeave",dependencies:["mouseout","mouseover"]},pointerEnter:{registrationName:"onPointerEnter",dependencies:["pointerout","pointerover"]},pointerLeave:{registrationName:"onPointerLeave",dependencies:["pointerout","pointerover"]}},_a={eventTypes:Br,extractEvents:i(function(e,t,n,r,s){var d=e==="mouseover"||e==="pointerover",m=e==="mouseout"||e==="pointerout";if(d&&!(s&32)&&(n.relatedTarget||n.fromElement)||!m&&!d)return null;if(d=r.window===r?r:(d=r.ownerDocument)?d.defaultView||d.parentWindow:window,m){if(m=t,t=(t=n.relatedTarget||n.toElement)?Qt(t):null,t!==null){var v=sn(t);(t!==v||t.tag!==5&&t.tag!==6)&&(t=null)}}else m=null;if(m===t)return null;if(e==="mouseout"||e==="mouseover")var L=Nn,S=Br.mouseLeave,ne=Br.mouseEnter,se="mouse";else(e==="pointerout"||e==="pointerover")&&(L=il,S=Br.pointerLeave,ne=Br.pointerEnter,se="pointer");if(e=m==null?d:pn(m),d=t==null?d:pn(t),S=L.getPooled(S,m,n,r),S.type=se+"leave",S.target=e,S.relatedTarget=d,n=L.getPooled(ne,t,n,r),n.type=se+"enter",n.target=d,n.relatedTarget=e,r=m,se=t,r&&se)e:{for(L=r,ne=se,m=0,e=L;e;e=Bt(e))m++;for(e=0,t=ne;t;t=Bt(t))e++;for(;0<m-e;)L=Bt(L),m--;for(;0<e-m;)ne=Bt(ne),e--;for(;m--;){if(L===ne||L===ne.alternate)break e;L=Bt(L),ne=Bt(ne)}L=null}else L=null;for(ne=L,L=[];r&&r!==ne&&(m=r.alternate,!(m!==null&&m===ne));)L.push(r),r=Bt(r);for(r=[];se&&se!==ne&&(m=se.alternate,!(m!==null&&m===ne));)r.push(se),se=Bt(se);for(se=0;se<L.length;se++)Ho(L[se],"bubbled",S);for(se=r.length;0<se--;)Ho(r[se],"captured",n);return s&64?[S,n]:[S]},"extractEvents")};function ws(e,t){return e===t&&(e!==0||1/e===1/t)||e!==e&&t!==t}i(ws,"Ze");var Rn=typeof Object.is=="function"?Object.is:ws,xs=Object.prototype.hasOwnProperty;function dr(e,t){if(Rn(e,t))return!0;if(typeof e!="object"||e===null||typeof t!="object"||t===null)return!1;var n=Object.keys(e),r=Object.keys(t);if(n.length!==r.length)return!1;for(r=0;r<n.length;r++)if(!xs.call(t,n[r])||!Rn(e[n[r]],t[n[r]]))return!1;return!0}i(dr,"bf");var Es=ue&&"documentMode"in document&&11>=document.documentMode,ll={select:{phasedRegistrationNames:{bubbled:"onSelect",captured:"onSelectCapture"},dependencies:"blur contextmenu dragend focus keydown keyup mousedown mouseup selectionchange".split(" ")}},hn=null,Uo=null,Pn=null,Wo=!1;function bs(e,t){var n=t.window===t?t.document:t.nodeType===9?t:t.ownerDocument;return Wo||hn==null||hn!==rr(n)?null:(n=hn,"selectionStart"in n&&Lo(n)?n={start:n.selectionStart,end:n.selectionEnd}:(n=(n.ownerDocument&&n.ownerDocument.defaultView||window).getSelection(),n={anchorNode:n.anchorNode,anchorOffset:n.anchorOffset,focusNode:n.focusNode,focusOffset:n.focusOffset}),Pn&&dr(Pn,n)?null:(Pn=n,e=kt.getPooled(ll.select,Uo,e,t),e.type="select",e.target=hn,Tn(e),e))}i(bs,"jf");var ks={eventTypes:ll,extractEvents:i(function(e,t,n,r,s,d){if(s=d||(r.window===r?r.document:r.nodeType===9?r:r.ownerDocument),!(d=!s)){e:{s=ao(s),d=re.onSelect;for(var m=0;m<d.length;m++)if(!s.has(d[m])){s=!1;break e}s=!0}d=!s}if(d)return null;switch(s=t?pn(t):window,e){case"focus":($o(s)||s.contentEditable==="true")&&(hn=s,Uo=t,Pn=null);break;case"blur":Pn=Uo=hn=null;break;case"mousedown":Wo=!0;break;case"contextmenu":case"mouseup":case"dragend":return Wo=!1,bs(n,r);case"selectionchange":if(Es)break;case"keydown":case"keyup":return bs(n,r)}return null},"extractEvents")},_s=kt.extend({animationName:null,elapsedTime:null,pseudoElement:null}),Ls=kt.extend({clipboardData:i(function(e){return"clipboardData"in e?e.clipboardData:window.clipboardData},"clipboardData")}),Ss=cr.extend({relatedTarget:null});function jr(e){var t=e.keyCode;return"charCode"in e?(e=e.charCode,e===0&&t===13&&(e=13)):e=t,e===10&&(e=13),32<=e||e===13?e:0}i(jr,"of");var Ts={Esc:"Escape",Spacebar:" ",Left:"ArrowLeft",Up:"ArrowUp",Right:"ArrowRight",Down:"ArrowDown",Del:"Delete",Win:"OS",Menu:"ContextMenu",Apps:"ContextMenu",Scroll:"ScrollLock",MozPrintableKey:"Unidentified"},Ms={8:"Backspace",9:"Tab",12:"Clear",13:"Enter",16:"Shift",17:"Control",18:"Alt",19:"Pause",20:"CapsLock",27:"Escape",32:" ",33:"PageUp",34:"PageDown",35:"End",36:"Home",37:"ArrowLeft",38:"ArrowUp",39:"ArrowRight",40:"ArrowDown",45:"Insert",46:"Delete",112:"F1",113:"F2",114:"F3",115:"F4",116:"F5",117:"F6",118:"F7",119:"F8",120:"F9",121:"F10",122:"F11",123:"F12",144:"NumLock",145:"ScrollLock",224:"Meta"},Ns=cr.extend({key:i(function(e){if(e.key){var t=Ts[e.key]||e.key;if(t!=="Unidentified")return t}return e.type==="keypress"?(e=jr(e),e===13?"Enter":String.fromCharCode(e)):e.type==="keydown"||e.type==="keyup"?Ms[e.keyCode]||"Unidentified":""},"key"),location:null,ctrlKey:null,shiftKey:null,altKey:null,metaKey:null,repeat:null,locale:null,getModifierState:Bo,charCode:i(function(e){return e.type==="keypress"?jr(e):0},"charCode"),keyCode:i(function(e){return e.type==="keydown"||e.type==="keyup"?e.keyCode:0},"keyCode"),which:i(function(e){return e.type==="keypress"?jr(e):e.type==="keydown"||e.type==="keyup"?e.keyCode:0},"which")}),Rs=Nn.extend({dataTransfer:null}),Ps=cr.extend({touches:null,targetTouches:null,changedTouches:null,altKey:null,metaKey:null,ctrlKey:null,shiftKey:null,getModifierState:Bo}),Os=kt.extend({propertyName:null,elapsedTime:null,pseudoElement:null}),sl=Nn.extend({deltaX:i(function(e){return"deltaX"in e?e.deltaX:"wheelDeltaX"in e?-e.wheelDeltaX:0},"deltaX"),deltaY:i(function(e){return"deltaY"in e?e.deltaY:"wheelDeltaY"in e?-e.wheelDeltaY:"wheelDelta"in e?-e.wheelDelta:0},"deltaY"),deltaZ:null,deltaMode:null}),al={eventTypes:Ii,extractEvents:i(function(e,t,n,r){var s=Rr.get(e);if(!s)return null;switch(e){case"keypress":if(jr(n)===0)return null;case"keydown":case"keyup":e=Ns;break;case"blur":case"focus":e=Ss;break;case"click":if(n.button===2)return null;case"auxclick":case"dblclick":case"mousedown":case"mousemove":case"mouseup":case"mouseout":case"mouseover":case"contextmenu":e=Nn;break;case"drag":case"dragend":case"dragenter":case"dragexit":case"dragleave":case"dragover":case"dragstart":case"drop":e=Rs;break;case"touchcancel":case"touchend":case"touchmove":case"touchstart":e=Ps;break;case ql:case Li:case Yn:e=_s;break;case Si:e=Os;break;case"scroll":e=cr;break;case"wheel":e=sl;break;case"copy":case"cut":case"paste":e=Ls;break;case"gotpointercapture":case"lostpointercapture":case"pointercancel":case"pointerdown":case"pointermove":case"pointerout":case"pointerover":case"pointerup":e=il;break;default:e=kt}return t=e.getPooled(s,t,n,r),Tn(t),t},"extractEvents")};if(N)throw Error(h(101));N=Array.prototype.slice.call("ResponderEventPlugin SimpleEventPlugin EnterLeaveEventPlugin ChangeEventPlugin SelectEventPlugin BeforeInputEventPlugin".split(" ")),ie();var Ds=ir;me=Ao,Ae=Ds,nt=pn,X({SimpleEventPlugin:al,EnterLeaveEventPlugin:_a,ChangeEventPlugin:Cs,SelectEventPlugin:ks,BeforeInputEventPlugin:ps});var qo=[],On=-1;function Ye(e){0>On||(e.current=qo[On],qo[On]=null,On--)}i(Ye,"H");function Je(e,t){On++,qo[On]=e.current,e.current=t}i(Je,"I");var Yt={},ct={current:Yt},gt={current:!1},vn=Yt;function Dn(e,t){var n=e.type.contextTypes;if(!n)return Yt;var r=e.stateNode;if(r&&r.__reactInternalMemoizedUnmaskedChildContext===t)return r.__reactInternalMemoizedMaskedChildContext;var s={},d;for(d in n)s[d]=t[d];return r&&(e=e.stateNode,e.__reactInternalMemoizedUnmaskedChildContext=t,e.__reactInternalMemoizedMaskedChildContext=s),s}i(Dn,"Cf");function dt(e){return e=e.childContextTypes,e!=null}i(dt,"L");function Ut(){Ye(gt),Ye(ct)}i(Ut,"Df");function Ur(e,t,n){if(ct.current!==Yt)throw Error(h(168));Je(ct,t),Je(gt,n)}i(Ur,"Ef");function Wr(e,t,n){var r=e.stateNode;if(e=t.childContextTypes,typeof r.getChildContext!="function")return n;r=r.getChildContext();for(var s in r)if(!(s in e))throw Error(h(108,At(t)||"Unknown",s));return T({},n,{},r)}i(Wr,"Ff");function An(e){return e=(e=e.stateNode)&&e.__reactInternalMemoizedMergedChildContext||Yt,vn=ct.current,Je(ct,e),Je(gt,gt.current),!0}i(An,"Gf");function qr(e,t,n){var r=e.stateNode;if(!r)throw Error(h(169));n?(e=Wr(e,t,vn),r.__reactInternalMemoizedMergedChildContext=e,Ye(gt),Ye(ct),Je(ct,e)):Ye(gt),Je(gt,n)}i(qr,"Hf");var Zo=g.unstable_runWithPriority,fr=g.unstable_scheduleCallback,Zr=g.unstable_cancelCallback,Gt=g.unstable_requestPaint,mr=g.unstable_now,Qo=g.unstable_getCurrentPriorityLevel,In=g.unstable_ImmediatePriority,Qr=g.unstable_UserBlockingPriority,o=g.unstable_NormalPriority,a=g.unstable_LowPriority,u=g.unstable_IdlePriority,c={},f=g.unstable_shouldYield,p=Gt!==void 0?Gt:function(){},y=null,C=null,E=!1,R=mr(),j=1e4>R?mr:function(){return mr()-R};function z(){switch(Qo()){case In:return 99;case Qr:return 98;case o:return 97;case a:return 96;case u:return 95;default:throw Error(h(332))}}i(z,"ag");function le(e){switch(e){case 99:return In;case 98:return Qr;case 97:return o;case 96:return a;case 95:return u;default:throw Error(h(332))}}i(le,"bg");function ce(e,t){return e=le(e),Zo(e,t)}i(ce,"cg");function A(e,t,n){return e=le(e),fr(e,t,n)}i(A,"dg");function Ne(e){return y===null?(y=[e],C=fr(In,Ie)):y.push(e),c}i(Ne,"eg");function pe(){if(C!==null){var e=C;C=null,Zr(e)}Ie()}i(pe,"gg");function Ie(){if(!E&&y!==null){E=!0;var e=0;try{var t=y;ce(99,function(){for(;e<t.length;e++){var n=t[e];do n=n(!0);while(n!==null)}}),y=null}catch(n){throw y!==null&&(y=y.slice(e+1)),fr(In,pe),n}finally{E=!1}}}i(Ie,"fg");function Ue(e,t,n){return n/=10,1073741821-(((1073741821-e+t/10)/n|0)+1)*n}i(Ue,"hg");function Se(e,t){if(e&&e.defaultProps){t=T({},t),e=e.defaultProps;for(var n in e)t[n]===void 0&&(t[n]=e[n])}return t}i(Se,"ig");var Te={current:null},Ge=null,ye=null,Ze=null;function ft(){Ze=ye=Ge=null}i(ft,"ng");function Xt(e){var t=Te.current;Ye(Te),e.type._context._currentValue=t}i(Xt,"og");function mt(e,t){for(;e!==null;){var n=e.alternate;if(e.childExpirationTime<t)e.childExpirationTime=t,n!==null&&n.childExpirationTime<t&&(n.childExpirationTime=t);else if(n!==null&&n.childExpirationTime<t)n.childExpirationTime=t;else break;e=e.return}}i(mt,"pg");function lt(e,t){Ge=e,Ze=ye=null,e=e.dependencies,e!==null&&e.firstContext!==null&&(e.expirationTime>=t&&(tn=!0),e.firstContext=null)}i(lt,"qg");function yt(e,t){if(Ze!==e&&t!==!1&&t!==0)if((typeof t!="number"||t===1073741823)&&(Ze=e,t=1073741823),t={context:e,observedBits:t,next:null},ye===null){if(Ge===null)throw Error(h(308));ye=t,Ge.dependencies={expirationTime:0,firstContext:t,responders:null}}else ye=ye.next=t;return e._currentValue}i(yt,"sg");var je=!1;function Lt(e){e.updateQueue={baseState:e.memoizedState,baseQueue:null,shared:{pending:null},effects:null}}i(Lt,"ug");function Kr(e,t){e=e.updateQueue,t.updateQueue===e&&(t.updateQueue={baseState:e.baseState,baseQueue:e.baseQueue,shared:e.shared,effects:e.effects})}i(Kr,"vg");function Jt(e,t){return e={expirationTime:e,suspenseConfig:t,tag:0,payload:null,callback:null,next:null},e.next=e}i(Jt,"wg");function Hn(e,t){if(e=e.updateQueue,e!==null){e=e.shared;var n=e.pending;n===null?t.next=t:(t.next=n.next,n.next=t),e.pending=t}}i(Hn,"xg");function La(e,t){var n=e.alternate;n!==null&&Kr(n,e),e=e.updateQueue,n=e.baseQueue,n===null?(e.baseQueue=t.next=t,t.next=t):(t.next=n.next,n.next=t)}i(La,"yg");function Ko(e,t,n,r){var s=e.updateQueue;je=!1;var d=s.baseQueue,m=s.shared.pending;if(m!==null){if(d!==null){var v=d.next;d.next=m.next,m.next=v}d=m,s.shared.pending=null,v=e.alternate,v!==null&&(v=v.updateQueue,v!==null&&(v.baseQueue=m))}if(d!==null){v=d.next;var L=s.baseState,S=0,ne=null,se=null,Fe=null;if(v!==null){var We=v;do{if(m=We.expirationTime,m<r){var $t={expirationTime:We.expirationTime,suspenseConfig:We.suspenseConfig,tag:We.tag,payload:We.payload,callback:We.callback,next:null};Fe===null?(se=Fe=$t,ne=L):Fe=Fe.next=$t,m>S&&(S=m)}else{Fe!==null&&(Fe=Fe.next={expirationTime:1073741823,suspenseConfig:We.suspenseConfig,tag:We.tag,payload:We.payload,callback:We.callback,next:null}),Eu(m,We.suspenseConfig);e:{var Ct=e,b=We;switch(m=t,$t=n,b.tag){case 1:if(Ct=b.payload,typeof Ct=="function"){L=Ct.call($t,L,m);break e}L=Ct;break e;case 3:Ct.effectTag=Ct.effectTag&-4097|64;case 0:if(Ct=b.payload,m=typeof Ct=="function"?Ct.call($t,L,m):Ct,m==null)break e;L=T({},L,m);break e;case 2:je=!0}}We.callback!==null&&(e.effectTag|=32,m=s.effects,m===null?s.effects=[We]:m.push(We))}if(We=We.next,We===null||We===v){if(m=s.shared.pending,m===null)break;We=d.next=m.next,m.next=v,s.baseQueue=d=m,s.shared.pending=null}}while(!0)}Fe===null?ne=L:Fe.next=se,s.baseState=ne,s.baseQueue=Fe,Al(S),e.expirationTime=S,e.memoizedState=L}}i(Ko,"zg");function Sa(e,t,n){if(e=t.effects,t.effects=null,e!==null)for(t=0;t<e.length;t++){var r=e[t],s=r.callback;if(s!==null){if(r.callback=null,r=s,s=n,typeof r!="function")throw Error(h(191,r));r.call(s)}}}i(Sa,"Cg");var Yo=_t.ReactCurrentBatchConfig,Ta=new V.Component().refs;function ul(e,t,n,r){t=e.memoizedState,n=n(r,t),n=n==null?t:T({},t,n),e.memoizedState=n,e.expirationTime===0&&(e.updateQueue.baseState=n)}i(ul,"Fg");var cl={isMounted:i(function(e){return(e=e._reactInternalFiber)?sn(e)===e:!1},"isMounted"),enqueueSetState:i(function(e,t,n){e=e._reactInternalFiber;var r=rn(),s=Yo.suspense;r=Cr(r,e,s),s=Jt(r,s),s.payload=t,n!=null&&(s.callback=n),Hn(e,s),zn(e,r)},"enqueueSetState"),enqueueReplaceState:i(function(e,t,n){e=e._reactInternalFiber;var r=rn(),s=Yo.suspense;r=Cr(r,e,s),s=Jt(r,s),s.tag=1,s.payload=t,n!=null&&(s.callback=n),Hn(e,s),zn(e,r)},"enqueueReplaceState"),enqueueForceUpdate:i(function(e,t){e=e._reactInternalFiber;var n=rn(),r=Yo.suspense;n=Cr(n,e,r),r=Jt(n,r),r.tag=2,t!=null&&(r.callback=t),Hn(e,r),zn(e,n)},"enqueueForceUpdate")};function Ma(e,t,n,r,s,d,m){return e=e.stateNode,typeof e.shouldComponentUpdate=="function"?e.shouldComponentUpdate(r,d,m):t.prototype&&t.prototype.isPureReactComponent?!dr(n,r)||!dr(s,d):!0}i(Ma,"Kg");function Na(e,t,n){var r=!1,s=Yt,d=t.contextType;return typeof d=="object"&&d!==null?d=yt(d):(s=dt(t)?vn:ct.current,r=t.contextTypes,d=(r=r!=null)?Dn(e,s):Yt),t=new t(n,d),e.memoizedState=t.state!==null&&t.state!==void 0?t.state:null,t.updater=cl,e.stateNode=t,t._reactInternalFiber=e,r&&(e=e.stateNode,e.__reactInternalMemoizedUnmaskedChildContext=s,e.__reactInternalMemoizedMaskedChildContext=d),t}i(Na,"Lg");function Ra(e,t,n,r){e=t.state,typeof t.componentWillReceiveProps=="function"&&t.componentWillReceiveProps(n,r),typeof t.UNSAFE_componentWillReceiveProps=="function"&&t.UNSAFE_componentWillReceiveProps(n,r),t.state!==e&&cl.enqueueReplaceState(t,t.state,null)}i(Ra,"Mg");function As(e,t,n,r){var s=e.stateNode;s.props=n,s.state=e.memoizedState,s.refs=Ta,Lt(e);var d=t.contextType;typeof d=="object"&&d!==null?s.context=yt(d):(d=dt(t)?vn:ct.current,s.context=Dn(e,d)),Ko(e,n,s,r),s.state=e.memoizedState,d=t.getDerivedStateFromProps,typeof d=="function"&&(ul(e,t,d,n),s.state=e.memoizedState),typeof t.getDerivedStateFromProps=="function"||typeof s.getSnapshotBeforeUpdate=="function"||typeof s.UNSAFE_componentWillMount!="function"&&typeof s.componentWillMount!="function"||(t=s.state,typeof s.componentWillMount=="function"&&s.componentWillMount(),typeof s.UNSAFE_componentWillMount=="function"&&s.UNSAFE_componentWillMount(),t!==s.state&&cl.enqueueReplaceState(s,s.state,null),Ko(e,n,s,r),s.state=e.memoizedState),typeof s.componentDidMount=="function"&&(e.effectTag|=4)}i(As,"Ng");var dl=Array.isArray;function Go(e,t,n){if(e=n.ref,e!==null&&typeof e!="function"&&typeof e!="object"){if(n._owner){if(n=n._owner,n){if(n.tag!==1)throw Error(h(309));var r=n.stateNode}if(!r)throw Error(h(147,e));var s=""+e;return t!==null&&t.ref!==null&&typeof t.ref=="function"&&t.ref._stringRef===s?t.ref:(t=i(function(d){var m=r.refs;m===Ta&&(m=r.refs={}),d===null?delete m[s]:m[s]=d},"b"),t._stringRef=s,t)}if(typeof e!="string")throw Error(h(284));if(!n._owner)throw Error(h(290,e))}return e}i(Go,"Pg");function fl(e,t){if(e.type!=="textarea")throw Error(h(31,Object.prototype.toString.call(t)==="[object Object]"?"object with keys {"+Object.keys(t).join(", ")+"}":t,""))}i(fl,"Qg");function Pa(e){function t(b,x){if(e){var M=b.lastEffect;M!==null?(M.nextEffect=x,b.lastEffect=x):b.firstEffect=b.lastEffect=x,x.nextEffect=null,x.effectTag=8}}i(t,"b");function n(b,x){if(!e)return null;for(;x!==null;)t(b,x),x=x.sibling;return null}i(n,"c");function r(b,x){for(b=new Map;x!==null;)x.key!==null?b.set(x.key,x):b.set(x.index,x),x=x.sibling;return b}i(r,"d");function s(b,x){return b=br(b,x),b.index=0,b.sibling=null,b}i(s,"e");function d(b,x,M){return b.index=M,e?(M=b.alternate,M!==null?(M=M.index,M<x?(b.effectTag=2,x):M):(b.effectTag=2,x)):x}i(d,"f");function m(b){return e&&b.alternate===null&&(b.effectTag=2),b}i(m,"g");function v(b,x,M,q){return x===null||x.tag!==6?(x=va(M,b.mode,q),x.return=b,x):(x=s(x,M),x.return=b,x)}i(v,"h");function L(b,x,M,q){return x!==null&&x.elementType===M.type?(q=s(x,M.props),q.ref=Go(b,x,M),q.return=b,q):(q=Il(M.type,M.key,M.props,null,b.mode,q),q.ref=Go(b,x,M),q.return=b,q)}i(L,"k");function S(b,x,M,q){return x===null||x.tag!==4||x.stateNode.containerInfo!==M.containerInfo||x.stateNode.implementation!==M.implementation?(x=ga(M,b.mode,q),x.return=b,x):(x=s(x,M.children||[]),x.return=b,x)}i(S,"l");function ne(b,x,M,q,te){return x===null||x.tag!==7?(x=Bn(M,b.mode,q,te),x.return=b,x):(x=s(x,M),x.return=b,x)}i(ne,"m");function se(b,x,M){if(typeof x=="string"||typeof x=="number")return x=va(""+x,b.mode,M),x.return=b,x;if(typeof x=="object"&&x!==null){switch(x.$$typeof){case Ee:return M=Il(x.type,x.key,x.props,null,b.mode,M),M.ref=Go(b,null,x),M.return=b,M;case Un:return x=ga(x,b.mode,M),x.return=b,x}if(dl(x)||qn(x))return x=Bn(x,b.mode,M,null),x.return=b,x;fl(b,x)}return null}i(se,"p");function Fe(b,x,M,q){var te=x!==null?x.key:null;if(typeof M=="string"||typeof M=="number")return te!==null?null:v(b,x,""+M,q);if(typeof M=="object"&&M!==null){switch(M.$$typeof){case Ee:return M.key===te?M.type===qt?ne(b,x,M.props.children,q,te):L(b,x,M,q):null;case Un:return M.key===te?S(b,x,M,q):null}if(dl(M)||qn(M))return te!==null?null:ne(b,x,M,q,null);fl(b,M)}return null}i(Fe,"x");function We(b,x,M,q,te){if(typeof q=="string"||typeof q=="number")return b=b.get(M)||null,v(x,b,""+q,te);if(typeof q=="object"&&q!==null){switch(q.$$typeof){case Ee:return b=b.get(q.key===null?M:q.key)||null,q.type===qt?ne(x,b,q.props.children,te,q.key):L(x,b,q,te);case Un:return b=b.get(q.key===null?M:q.key)||null,S(x,b,q,te)}if(dl(q)||qn(q))return b=b.get(M)||null,ne(x,b,q,te,null);fl(x,q)}return null}i(We,"z");function $t(b,x,M,q){for(var te=null,ae=null,xe=x,$e=x=0,et=null;xe!==null&&$e<M.length;$e++){xe.index>$e?(et=xe,xe=null):et=xe.sibling;var Oe=Fe(b,xe,M[$e],q);if(Oe===null){xe===null&&(xe=et);break}e&&xe&&Oe.alternate===null&&t(b,xe),x=d(Oe,x,$e),ae===null?te=Oe:ae.sibling=Oe,ae=Oe,xe=et}if($e===M.length)return n(b,xe),te;if(xe===null){for(;$e<M.length;$e++)xe=se(b,M[$e],q),xe!==null&&(x=d(xe,x,$e),ae===null?te=xe:ae.sibling=xe,ae=xe);return te}for(xe=r(b,xe);$e<M.length;$e++)et=We(xe,b,$e,M[$e],q),et!==null&&(e&&et.alternate!==null&&xe.delete(et.key===null?$e:et.key),x=d(et,x,$e),ae===null?te=et:ae.sibling=et,ae=et);return e&&xe.forEach(function(jn){return t(b,jn)}),te}i($t,"ca");function Ct(b,x,M,q){var te=qn(M);if(typeof te!="function")throw Error(h(150));if(M=te.call(M),M==null)throw Error(h(151));for(var ae=te=null,xe=x,$e=x=0,et=null,Oe=M.next();xe!==null&&!Oe.done;$e++,Oe=M.next()){xe.index>$e?(et=xe,xe=null):et=xe.sibling;var jn=Fe(b,xe,Oe.value,q);if(jn===null){xe===null&&(xe=et);break}e&&xe&&jn.alternate===null&&t(b,xe),x=d(jn,x,$e),ae===null?te=jn:ae.sibling=jn,ae=jn,xe=et}if(Oe.done)return n(b,xe),te;if(xe===null){for(;!Oe.done;$e++,Oe=M.next())Oe=se(b,Oe.value,q),Oe!==null&&(x=d(Oe,x,$e),ae===null?te=Oe:ae.sibling=Oe,ae=Oe);return te}for(xe=r(b,xe);!Oe.done;$e++,Oe=M.next())Oe=We(xe,b,$e,Oe.value,q),Oe!==null&&(e&&Oe.alternate!==null&&xe.delete(Oe.key===null?$e:Oe.key),x=d(Oe,x,$e),ae===null?te=Oe:ae.sibling=Oe,ae=Oe);return e&&xe.forEach(function(oc){return t(b,oc)}),te}return i(Ct,"D"),function(b,x,M,q){var te=typeof M=="object"&&M!==null&&M.type===qt&&M.key===null;te&&(M=M.props.children);var ae=typeof M=="object"&&M!==null;if(ae)switch(M.$$typeof){case Ee:e:{for(ae=M.key,te=x;te!==null;){if(te.key===ae){switch(te.tag){case 7:if(M.type===qt){n(b,te.sibling),x=s(te,M.props.children),x.return=b,b=x;break e}break;default:if(te.elementType===M.type){n(b,te.sibling),x=s(te,M.props),x.ref=Go(b,te,M),x.return=b,b=x;break e}}n(b,te);break}else t(b,te);te=te.sibling}M.type===qt?(x=Bn(M.props.children,b.mode,q,M.key),x.return=b,b=x):(q=Il(M.type,M.key,M.props,null,b.mode,q),q.ref=Go(b,x,M),q.return=b,b=q)}return m(b);case Un:e:{for(te=M.key;x!==null;){if(x.key===te)if(x.tag===4&&x.stateNode.containerInfo===M.containerInfo&&x.stateNode.implementation===M.implementation){n(b,x.sibling),x=s(x,M.children||[]),x.return=b,b=x;break e}else{n(b,x);break}else t(b,x);x=x.sibling}x=ga(M,b.mode,q),x.return=b,b=x}return m(b)}if(typeof M=="string"||typeof M=="number")return M=""+M,x!==null&&x.tag===6?(n(b,x.sibling),x=s(x,M),x.return=b,b=x):(n(b,x),x=va(M,b.mode,q),x.return=b,b=x),m(b);if(dl(M))return $t(b,x,M,q);if(qn(M))return Ct(b,x,M,q);if(ae&&fl(b,M),typeof M=="undefined"&&!te)switch(b.tag){case 1:case 0:throw b=b.type,Error(h(152,b.displayName||b.name||"Component"))}return n(b,x)}}i(Pa,"Rg");var Yr=Pa(!0),Is=Pa(!1),Xo={},en={current:Xo},Jo={current:Xo},ei={current:Xo};function pr(e){if(e===Xo)throw Error(h(174));return e}i(pr,"ch");function Hs(e,t){switch(Je(ei,t),Je(Jo,e),Je(en,Xo),e=t.nodeType,e){case 9:case 11:t=(t=t.documentElement)?t.namespaceURI:so(null,"");break;default:e=e===8?t.parentNode:t,t=e.namespaceURI||null,e=e.tagName,t=so(t,e)}Ye(en),Je(en,t)}i(Hs,"dh");function Gr(){Ye(en),Ye(Jo),Ye(ei)}i(Gr,"eh");function Oa(e){pr(ei.current);var t=pr(en.current),n=so(t,e.type);t!==n&&(Je(Jo,e),Je(en,n))}i(Oa,"fh");function Fs(e){Jo.current===e&&(Ye(en),Ye(Jo))}i(Fs,"gh");var tt={current:0};function ml(e){for(var t=e;t!==null;){if(t.tag===13){var n=t.memoizedState;if(n!==null&&(n=n.dehydrated,n===null||n.data===So||n.data===To))return t}else if(t.tag===19&&t.memoizedProps.revealOrder!==void 0){if(t.effectTag&64)return t}else if(t.child!==null){t.child.return=t,t=t.child;continue}if(t===e)break;for(;t.sibling===null;){if(t.return===null||t.return===e)return null;t=t.return}t.sibling.return=t.return,t=t.sibling}return null}i(ml,"hh");function Vs(e,t){return{responder:e,props:t}}i(Vs,"ih");var pl=_t.ReactCurrentDispatcher,Vt=_t.ReactCurrentBatchConfig,Fn=0,st=null,xt=null,Et=null,hl=!1;function Rt(){throw Error(h(321))}i(Rt,"Q");function $s(e,t){if(t===null)return!1;for(var n=0;n<t.length&&n<e.length;n++)if(!Rn(e[n],t[n]))return!1;return!0}i($s,"nh");function zs(e,t,n,r,s,d){if(Fn=d,st=t,t.memoizedState=null,t.updateQueue=null,t.expirationTime=0,pl.current=e===null||e.memoizedState===null?Ru:Pu,e=n(r,s),t.expirationTime===Fn){d=0;do{if(t.expirationTime=0,!(25>d))throw Error(h(301));d+=1,Et=xt=null,t.updateQueue=null,pl.current=Ou,e=n(r,s)}while(t.expirationTime===Fn)}if(pl.current=wl,t=xt!==null&&xt.next!==null,Fn=0,Et=xt=st=null,hl=!1,t)throw Error(h(300));return e}i(zs,"oh");function Xr(){var e={memoizedState:null,baseState:null,baseQueue:null,queue:null,next:null};return Et===null?st.memoizedState=Et=e:Et=Et.next=e,Et}i(Xr,"th");function Jr(){if(xt===null){var e=st.alternate;e=e!==null?e.memoizedState:null}else e=xt.next;var t=Et===null?st.memoizedState:Et.next;if(t!==null)Et=t,xt=e;else{if(e===null)throw Error(h(310));xt=e,e={memoizedState:xt.memoizedState,baseState:xt.baseState,baseQueue:xt.baseQueue,queue:xt.queue,next:null},Et===null?st.memoizedState=Et=e:Et=Et.next=e}return Et}i(Jr,"uh");function hr(e,t){return typeof t=="function"?t(e):t}i(hr,"vh");function vl(e){var t=Jr(),n=t.queue;if(n===null)throw Error(h(311));n.lastRenderedReducer=e;var r=xt,s=r.baseQueue,d=n.pending;if(d!==null){if(s!==null){var m=s.next;s.next=d.next,d.next=m}r.baseQueue=s=d,n.pending=null}if(s!==null){s=s.next,r=r.baseState;var v=m=d=null,L=s;do{var S=L.expirationTime;if(S<Fn){var ne={expirationTime:L.expirationTime,suspenseConfig:L.suspenseConfig,action:L.action,eagerReducer:L.eagerReducer,eagerState:L.eagerState,next:null};v===null?(m=v=ne,d=r):v=v.next=ne,S>st.expirationTime&&(st.expirationTime=S,Al(S))}else v!==null&&(v=v.next={expirationTime:1073741823,suspenseConfig:L.suspenseConfig,action:L.action,eagerReducer:L.eagerReducer,eagerState:L.eagerState,next:null}),Eu(S,L.suspenseConfig),r=L.eagerReducer===e?L.eagerState:e(r,L.action);L=L.next}while(L!==null&&L!==s);v===null?d=r:v.next=m,Rn(r,t.memoizedState)||(tn=!0),t.memoizedState=r,t.baseState=d,t.baseQueue=v,n.lastRenderedState=r}return[t.memoizedState,n.dispatch]}i(vl,"wh");function gl(e){var t=Jr(),n=t.queue;if(n===null)throw Error(h(311));n.lastRenderedReducer=e;var r=n.dispatch,s=n.pending,d=t.memoizedState;if(s!==null){n.pending=null;var m=s=s.next;do d=e(d,m.action),m=m.next;while(m!==s);Rn(d,t.memoizedState)||(tn=!0),t.memoizedState=d,t.baseQueue===null&&(t.baseState=d),n.lastRenderedState=d}return[d,r]}i(gl,"xh");function Bs(e){var t=Xr();return typeof e=="function"&&(e=e()),t.memoizedState=t.baseState=e,e=t.queue={pending:null,dispatch:null,lastRenderedReducer:hr,lastRenderedState:e},e=e.dispatch=za.bind(null,st,e),[t.memoizedState,e]}i(Bs,"yh");function js(e,t,n,r){return e={tag:e,create:t,destroy:n,deps:r,next:null},t=st.updateQueue,t===null?(t={lastEffect:null},st.updateQueue=t,t.lastEffect=e.next=e):(n=t.lastEffect,n===null?t.lastEffect=e.next=e:(r=n.next,n.next=e,e.next=r,t.lastEffect=e)),e}i(js,"Ah");function Da(){return Jr().memoizedState}i(Da,"Bh");function Us(e,t,n,r){var s=Xr();st.effectTag|=e,s.memoizedState=js(1|t,n,void 0,r===void 0?null:r)}i(Us,"Ch");function Ws(e,t,n,r){var s=Jr();r=r===void 0?null:r;var d=void 0;if(xt!==null){var m=xt.memoizedState;if(d=m.destroy,r!==null&&$s(r,m.deps)){js(t,n,d,r);return}}st.effectTag|=e,s.memoizedState=js(1|t,n,d,r)}i(Ws,"Dh");function Aa(e,t){return Us(516,4,e,t)}i(Aa,"Eh");function yl(e,t){return Ws(516,4,e,t)}i(yl,"Fh");function Ia(e,t){return Ws(4,2,e,t)}i(Ia,"Gh");function Ha(e,t){if(typeof t=="function")return e=e(),t(e),function(){t(null)};if(t!=null)return e=e(),t.current=e,function(){t.current=null}}i(Ha,"Hh");function Fa(e,t,n){return n=n!=null?n.concat([e]):null,Ws(4,2,Ha.bind(null,t,e),n)}i(Fa,"Ih");function qs(){}i(qs,"Jh");function Va(e,t){return Xr().memoizedState=[e,t===void 0?null:t],e}i(Va,"Kh");function Cl(e,t){var n=Jr();t=t===void 0?null:t;var r=n.memoizedState;return r!==null&&t!==null&&$s(t,r[1])?r[0]:(n.memoizedState=[e,t],e)}i(Cl,"Lh");function $a(e,t){var n=Jr();t=t===void 0?null:t;var r=n.memoizedState;return r!==null&&t!==null&&$s(t,r[1])?r[0]:(e=e(),n.memoizedState=[e,t],e)}i($a,"Mh");function Zs(e,t,n){var r=z();ce(98>r?98:r,function(){e(!0)}),ce(97<r?97:r,function(){var s=Vt.suspense;Vt.suspense=t===void 0?null:t;try{e(!1),n()}finally{Vt.suspense=s}})}i(Zs,"Nh");function za(e,t,n){var r=rn(),s=Yo.suspense;r=Cr(r,e,s),s={expirationTime:r,suspenseConfig:s,action:n,eagerReducer:null,eagerState:null,next:null};var d=t.pending;if(d===null?s.next=s:(s.next=d.next,d.next=s),t.pending=s,d=e.alternate,e===st||d!==null&&d===st)hl=!0,s.expirationTime=Fn,st.expirationTime=Fn;else{if(e.expirationTime===0&&(d===null||d.expirationTime===0)&&(d=t.lastRenderedReducer,d!==null))try{var m=t.lastRenderedState,v=d(m,n);if(s.eagerReducer=d,s.eagerState=v,Rn(v,m))return}catch{}finally{}zn(e,r)}}i(za,"zh");var wl={readContext:yt,useCallback:Rt,useContext:Rt,useEffect:Rt,useImperativeHandle:Rt,useLayoutEffect:Rt,useMemo:Rt,useReducer:Rt,useRef:Rt,useState:Rt,useDebugValue:Rt,useResponder:Rt,useDeferredValue:Rt,useTransition:Rt},Ru={readContext:yt,useCallback:Va,useContext:yt,useEffect:Aa,useImperativeHandle:i(function(e,t,n){return n=n!=null?n.concat([e]):null,Us(4,2,Ha.bind(null,t,e),n)},"useImperativeHandle"),useLayoutEffect:i(function(e,t){return Us(4,2,e,t)},"useLayoutEffect"),useMemo:i(function(e,t){var n=Xr();return t=t===void 0?null:t,e=e(),n.memoizedState=[e,t],e},"useMemo"),useReducer:i(function(e,t,n){var r=Xr();return t=n!==void 0?n(t):t,r.memoizedState=r.baseState=t,e=r.queue={pending:null,dispatch:null,lastRenderedReducer:e,lastRenderedState:t},e=e.dispatch=za.bind(null,st,e),[r.memoizedState,e]},"useReducer"),useRef:i(function(e){var t=Xr();return e={current:e},t.memoizedState=e},"useRef"),useState:Bs,useDebugValue:qs,useResponder:Vs,useDeferredValue:i(function(e,t){var n=Bs(e),r=n[0],s=n[1];return Aa(function(){var d=Vt.suspense;Vt.suspense=t===void 0?null:t;try{s(e)}finally{Vt.suspense=d}},[e,t]),r},"useDeferredValue"),useTransition:i(function(e){var t=Bs(!1),n=t[0];return t=t[1],[Va(Zs.bind(null,t,e),[t,e]),n]},"useTransition")},Pu={readContext:yt,useCallback:Cl,useContext:yt,useEffect:yl,useImperativeHandle:Fa,useLayoutEffect:Ia,useMemo:$a,useReducer:vl,useRef:Da,useState:i(function(){return vl(hr)},"useState"),useDebugValue:qs,useResponder:Vs,useDeferredValue:i(function(e,t){var n=vl(hr),r=n[0],s=n[1];return yl(function(){var d=Vt.suspense;Vt.suspense=t===void 0?null:t;try{s(e)}finally{Vt.suspense=d}},[e,t]),r},"useDeferredValue"),useTransition:i(function(e){var t=vl(hr),n=t[0];return t=t[1],[Cl(Zs.bind(null,t,e),[t,e]),n]},"useTransition")},Ou={readContext:yt,useCallback:Cl,useContext:yt,useEffect:yl,useImperativeHandle:Fa,useLayoutEffect:Ia,useMemo:$a,useReducer:gl,useRef:Da,useState:i(function(){return gl(hr)},"useState"),useDebugValue:qs,useResponder:Vs,useDeferredValue:i(function(e,t){var n=gl(hr),r=n[0],s=n[1];return yl(function(){var d=Vt.suspense;Vt.suspense=t===void 0?null:t;try{s(e)}finally{Vt.suspense=d}},[e,t]),r},"useDeferredValue"),useTransition:i(function(e){var t=gl(hr),n=t[0];return t=t[1],[Cl(Zs.bind(null,t,e),[t,e]),n]},"useTransition")},gn=null,Vn=null,vr=!1;function Ba(e,t){var n=on(5,null,null,0);n.elementType="DELETED",n.type="DELETED",n.stateNode=t,n.return=e,n.effectTag=8,e.lastEffect!==null?(e.lastEffect.nextEffect=n,e.lastEffect=n):e.firstEffect=e.lastEffect=n}i(Ba,"Rh");function ja(e,t){switch(e.tag){case 5:var n=e.type;return t=t.nodeType!==1||n.toLowerCase()!==t.nodeName.toLowerCase()?null:t,t!==null?(e.stateNode=t,!0):!1;case 6:return t=e.pendingProps===""||t.nodeType!==3?null:t,t!==null?(e.stateNode=t,!0):!1;case 13:return!1;default:return!1}}i(ja,"Th");function Qs(e){if(vr){var t=Vn;if(t){var n=t;if(!ja(e,t)){if(t=Sn(n.nextSibling),!t||!ja(e,t)){e.effectTag=e.effectTag&-1025|2,vr=!1,gn=e;return}Ba(gn,n)}gn=e,Vn=Sn(t.firstChild)}else e.effectTag=e.effectTag&-1025|2,vr=!1,gn=e}}i(Qs,"Uh");function Ua(e){for(e=e.return;e!==null&&e.tag!==5&&e.tag!==3&&e.tag!==13;)e=e.return;gn=e}i(Ua,"Vh");function xl(e){if(e!==gn)return!1;if(!vr)return Ua(e),vr=!0,!1;var t=e.type;if(e.tag!==5||t!=="head"&&t!=="body"&&!Ro(t,e.memoizedProps))for(t=Vn;t;)Ba(e,t),t=Sn(t.nextSibling);if(Ua(e),e.tag===13){if(e=e.memoizedState,e=e!==null?e.dehydrated:null,!e)throw Error(h(317));e:{for(e=e.nextSibling,t=0;e;){if(e.nodeType===8){var n=e.data;if(n===Or){if(t===0){Vn=Sn(e.nextSibling);break e}t--}else n!==Ln&&n!==To&&n!==So||t++}e=e.nextSibling}Vn=null}}else Vn=gn?Sn(e.stateNode.nextSibling):null;return!0}i(xl,"Wh");function Ks(){Vn=gn=null,vr=!1}i(Ks,"Xh");var Du=_t.ReactCurrentOwner,tn=!1;function Pt(e,t,n,r){t.child=e===null?Is(t,null,n,r):Yr(t,e.child,n,r)}i(Pt,"R");function Wa(e,t,n,r,s){n=n.render;var d=t.ref;return lt(t,s),r=zs(e,t,n,r,d,s),e!==null&&!tn?(t.updateQueue=e.updateQueue,t.effectTag&=-517,e.expirationTime<=s&&(e.expirationTime=0),yn(e,t,s)):(t.effectTag|=1,Pt(e,t,r,s),t.child)}i(Wa,"Zh");function qa(e,t,n,r,s,d){if(e===null){var m=n.type;return typeof m=="function"&&!ha(m)&&m.defaultProps===void 0&&n.compare===null&&n.defaultProps===void 0?(t.tag=15,t.type=m,Za(e,t,m,r,s,d)):(e=Il(n.type,null,r,null,t.mode,d),e.ref=t.ref,e.return=t,t.child=e)}return m=e.child,s<d&&(s=m.memoizedProps,n=n.compare,n=n!==null?n:dr,n(s,r)&&e.ref===t.ref)?yn(e,t,d):(t.effectTag|=1,e=br(m,r),e.ref=t.ref,e.return=t,t.child=e)}i(qa,"ai");function Za(e,t,n,r,s,d){return e!==null&&dr(e.memoizedProps,r)&&e.ref===t.ref&&(tn=!1,s<d)?(t.expirationTime=e.expirationTime,yn(e,t,d)):Ys(e,t,n,r,d)}i(Za,"ci");function Qa(e,t){var n=t.ref;(e===null&&n!==null||e!==null&&e.ref!==n)&&(t.effectTag|=128)}i(Qa,"ei");function Ys(e,t,n,r,s){var d=dt(n)?vn:ct.current;return d=Dn(t,d),lt(t,s),n=zs(e,t,n,r,d,s),e!==null&&!tn?(t.updateQueue=e.updateQueue,t.effectTag&=-517,e.expirationTime<=s&&(e.expirationTime=0),yn(e,t,s)):(t.effectTag|=1,Pt(e,t,n,s),t.child)}i(Ys,"di");function Ka(e,t,n,r,s){if(dt(n)){var d=!0;An(t)}else d=!1;if(lt(t,s),t.stateNode===null)e!==null&&(e.alternate=null,t.alternate=null,t.effectTag|=2),Na(t,n,r),As(t,n,r,s),r=!0;else if(e===null){var m=t.stateNode,v=t.memoizedProps;m.props=v;var L=m.context,S=n.contextType;typeof S=="object"&&S!==null?S=yt(S):(S=dt(n)?vn:ct.current,S=Dn(t,S));var ne=n.getDerivedStateFromProps,se=typeof ne=="function"||typeof m.getSnapshotBeforeUpdate=="function";se||typeof m.UNSAFE_componentWillReceiveProps!="function"&&typeof m.componentWillReceiveProps!="function"||(v!==r||L!==S)&&Ra(t,m,r,S),je=!1;var Fe=t.memoizedState;m.state=Fe,Ko(t,r,m,s),L=t.memoizedState,v!==r||Fe!==L||gt.current||je?(typeof ne=="function"&&(ul(t,n,ne,r),L=t.memoizedState),(v=je||Ma(t,n,v,r,Fe,L,S))?(se||typeof m.UNSAFE_componentWillMount!="function"&&typeof m.componentWillMount!="function"||(typeof m.componentWillMount=="function"&&m.componentWillMount(),typeof m.UNSAFE_componentWillMount=="function"&&m.UNSAFE_componentWillMount()),typeof m.componentDidMount=="function"&&(t.effectTag|=4)):(typeof m.componentDidMount=="function"&&(t.effectTag|=4),t.memoizedProps=r,t.memoizedState=L),m.props=r,m.state=L,m.context=S,r=v):(typeof m.componentDidMount=="function"&&(t.effectTag|=4),r=!1)}else m=t.stateNode,Kr(e,t),v=t.memoizedProps,m.props=t.type===t.elementType?v:Se(t.type,v),L=m.context,S=n.contextType,typeof S=="object"&&S!==null?S=yt(S):(S=dt(n)?vn:ct.current,S=Dn(t,S)),ne=n.getDerivedStateFromProps,(se=typeof ne=="function"||typeof m.getSnapshotBeforeUpdate=="function")||typeof m.UNSAFE_componentWillReceiveProps!="function"&&typeof m.componentWillReceiveProps!="function"||(v!==r||L!==S)&&Ra(t,m,r,S),je=!1,L=t.memoizedState,m.state=L,Ko(t,r,m,s),Fe=t.memoizedState,v!==r||L!==Fe||gt.current||je?(typeof ne=="function"&&(ul(t,n,ne,r),Fe=t.memoizedState),(ne=je||Ma(t,n,v,r,L,Fe,S))?(se||typeof m.UNSAFE_componentWillUpdate!="function"&&typeof m.componentWillUpdate!="function"||(typeof m.componentWillUpdate=="function"&&m.componentWillUpdate(r,Fe,S),typeof m.UNSAFE_componentWillUpdate=="function"&&m.UNSAFE_componentWillUpdate(r,Fe,S)),typeof m.componentDidUpdate=="function"&&(t.effectTag|=4),typeof m.getSnapshotBeforeUpdate=="function"&&(t.effectTag|=256)):(typeof m.componentDidUpdate!="function"||v===e.memoizedProps&&L===e.memoizedState||(t.effectTag|=4),typeof m.getSnapshotBeforeUpdate!="function"||v===e.memoizedProps&&L===e.memoizedState||(t.effectTag|=256),t.memoizedProps=r,t.memoizedState=Fe),m.props=r,m.state=Fe,m.context=S,r=ne):(typeof m.componentDidUpdate!="function"||v===e.memoizedProps&&L===e.memoizedState||(t.effectTag|=4),typeof m.getSnapshotBeforeUpdate!="function"||v===e.memoizedProps&&L===e.memoizedState||(t.effectTag|=256),r=!1);return Gs(e,t,n,r,d,s)}i(Ka,"fi");function Gs(e,t,n,r,s,d){Qa(e,t);var m=(t.effectTag&64)!==0;if(!r&&!m)return s&&qr(t,n,!1),yn(e,t,d);r=t.stateNode,Du.current=t;var v=m&&typeof n.getDerivedStateFromError!="function"?null:r.render();return t.effectTag|=1,e!==null&&m?(t.child=Yr(t,e.child,null,d),t.child=Yr(t,null,v,d)):Pt(e,t,v,d),t.memoizedState=r.state,s&&qr(t,n,!0),t.child}i(Gs,"gi");function Ya(e){var t=e.stateNode;t.pendingContext?Ur(e,t.pendingContext,t.pendingContext!==t.context):t.context&&Ur(e,t.context,!1),Hs(e,t.containerInfo)}i(Ya,"hi");var Xs={dehydrated:null,retryTime:0};function Ga(e,t,n){var r=t.mode,s=t.pendingProps,d=tt.current,m=!1,v;if((v=(t.effectTag&64)!==0)||(v=(d&2)!==0&&(e===null||e.memoizedState!==null)),v?(m=!0,t.effectTag&=-65):e!==null&&e.memoizedState===null||s.fallback===void 0||s.unstable_avoidThisFallback===!0||(d|=1),Je(tt,d&1),e===null){if(s.fallback!==void 0&&Qs(t),m){if(m=s.fallback,s=Bn(null,r,0,null),s.return=t,!(t.mode&2))for(e=t.memoizedState!==null?t.child.child:t.child,s.child=e;e!==null;)e.return=s,e=e.sibling;return n=Bn(m,r,n,null),n.return=t,s.sibling=n,t.memoizedState=Xs,t.child=s,n}return r=s.children,t.memoizedState=null,t.child=Is(t,null,r,n)}if(e.memoizedState!==null){if(e=e.child,r=e.sibling,m){if(s=s.fallback,n=br(e,e.pendingProps),n.return=t,!(t.mode&2)&&(m=t.memoizedState!==null?t.child.child:t.child,m!==e.child))for(n.child=m;m!==null;)m.return=n,m=m.sibling;return r=br(r,s),r.return=t,n.sibling=r,n.childExpirationTime=0,t.memoizedState=Xs,t.child=n,r}return n=Yr(t,e.child,s.children,n),t.memoizedState=null,t.child=n}if(e=e.child,m){if(m=s.fallback,s=Bn(null,r,0,null),s.return=t,s.child=e,e!==null&&(e.return=s),!(t.mode&2))for(e=t.memoizedState!==null?t.child.child:t.child,s.child=e;e!==null;)e.return=s,e=e.sibling;return n=Bn(m,r,n,null),n.return=t,s.sibling=n,n.effectTag|=2,s.childExpirationTime=0,t.memoizedState=Xs,t.child=s,n}return t.memoizedState=null,t.child=Yr(t,e,s.children,n)}i(Ga,"ji");function Xa(e,t){e.expirationTime<t&&(e.expirationTime=t);var n=e.alternate;n!==null&&n.expirationTime<t&&(n.expirationTime=t),mt(e.return,t)}i(Xa,"ki");function Js(e,t,n,r,s,d){var m=e.memoizedState;m===null?e.memoizedState={isBackwards:t,rendering:null,renderingStartTime:0,last:r,tail:n,tailExpiration:0,tailMode:s,lastEffect:d}:(m.isBackwards=t,m.rendering=null,m.renderingStartTime=0,m.last=r,m.tail=n,m.tailExpiration=0,m.tailMode=s,m.lastEffect=d)}i(Js,"li");function Ja(e,t,n){var r=t.pendingProps,s=r.revealOrder,d=r.tail;if(Pt(e,t,r.children,n),r=tt.current,r&2)r=r&1|2,t.effectTag|=64;else{if(e!==null&&e.effectTag&64)e:for(e=t.child;e!==null;){if(e.tag===13)e.memoizedState!==null&&Xa(e,n);else if(e.tag===19)Xa(e,n);else if(e.child!==null){e.child.return=e,e=e.child;continue}if(e===t)break e;for(;e.sibling===null;){if(e.return===null||e.return===t)break e;e=e.return}e.sibling.return=e.return,e=e.sibling}r&=1}if(Je(tt,r),!(t.mode&2))t.memoizedState=null;else switch(s){case"forwards":for(n=t.child,s=null;n!==null;)e=n.alternate,e!==null&&ml(e)===null&&(s=n),n=n.sibling;n=s,n===null?(s=t.child,t.child=null):(s=n.sibling,n.sibling=null),Js(t,!1,s,n,d,t.lastEffect);break;case"backwards":for(n=null,s=t.child,t.child=null;s!==null;){if(e=s.alternate,e!==null&&ml(e)===null){t.child=s;break}e=s.sibling,s.sibling=n,n=s,s=e}Js(t,!0,n,null,d,t.lastEffect);break;case"together":Js(t,!1,null,null,void 0,t.lastEffect);break;default:t.memoizedState=null}return t.child}i(Ja,"mi");function yn(e,t,n){e!==null&&(t.dependencies=e.dependencies);var r=t.expirationTime;if(r!==0&&Al(r),t.childExpirationTime<n)return null;if(e!==null&&t.child!==e.child)throw Error(h(153));if(t.child!==null){for(e=t.child,n=br(e,e.pendingProps),t.child=n,n.return=t;e.sibling!==null;)e=e.sibling,n=n.sibling=br(e,e.pendingProps),n.return=t;n.sibling=null}return t.child}i(yn,"$h");var eu,ea,tu,nu;eu=i(function(e,t){for(var n=t.child;n!==null;){if(n.tag===5||n.tag===6)e.appendChild(n.stateNode);else if(n.tag!==4&&n.child!==null){n.child.return=n,n=n.child;continue}if(n===t)break;for(;n.sibling===null;){if(n.return===null||n.return===t)return;n=n.return}n.sibling.return=n.return,n=n.sibling}},"ni"),ea=i(function(){},"oi"),tu=i(function(e,t,n,r,s){var d=e.memoizedProps;if(d!==r){var m=t.stateNode;switch(pr(en.current),e=null,n){case"input":d=hi(m,d),r=hi(m,r),e=[];break;case"option":d=yi(m,d),r=yi(m,r),e=[];break;case"select":d=T({},d,{value:void 0}),r=T({},r,{value:void 0}),e=[];break;case"textarea":d=Ci(m,d),r=Ci(m,r),e=[];break;default:typeof d.onClick!="function"&&typeof r.onClick=="function"&&(m.onclick=nr)}Eo(n,r);var v,L;n=null;for(v in d)if(!r.hasOwnProperty(v)&&d.hasOwnProperty(v)&&d[v]!=null)if(v==="style")for(L in m=d[v],m)m.hasOwnProperty(L)&&(n||(n={}),n[L]="");else v!=="dangerouslySetInnerHTML"&&v!=="children"&&v!=="suppressContentEditableWarning"&&v!=="suppressHydrationWarning"&&v!=="autoFocus"&&(H.hasOwnProperty(v)?e||(e=[]):(e=e||[]).push(v,null));for(v in r){var S=r[v];if(m=d!=null?d[v]:void 0,r.hasOwnProperty(v)&&S!==m&&(S!=null||m!=null))if(v==="style")if(m){for(L in m)!m.hasOwnProperty(L)||S&&S.hasOwnProperty(L)||(n||(n={}),n[L]="");for(L in S)S.hasOwnProperty(L)&&m[L]!==S[L]&&(n||(n={}),n[L]=S[L])}else n||(e||(e=[]),e.push(v,n)),n=S;else v==="dangerouslySetInnerHTML"?(S=S?S.__html:void 0,m=m?m.__html:void 0,S!=null&&m!==S&&(e=e||[]).push(v,S)):v==="children"?m===S||typeof S!="string"&&typeof S!="number"||(e=e||[]).push(v,""+S):v!=="suppressContentEditableWarning"&&v!=="suppressHydrationWarning"&&(H.hasOwnProperty(v)?(S!=null&&Ft(s,v),e||m===S||(e=[])):(e=e||[]).push(v,S))}n&&(e=e||[]).push("style",n),s=e,(t.updateQueue=s)&&(t.effectTag|=4)}},"pi"),nu=i(function(e,t,n,r){n!==r&&(t.effectTag|=4)},"qi");function El(e,t){switch(e.tailMode){case"hidden":t=e.tail;for(var n=null;t!==null;)t.alternate!==null&&(n=t),t=t.sibling;n===null?e.tail=null:n.sibling=null;break;case"collapsed":n=e.tail;for(var r=null;n!==null;)n.alternate!==null&&(r=n),n=n.sibling;r===null?t||e.tail===null?e.tail=null:e.tail.sibling=null:r.sibling=null}}i(El,"ri");function Au(e,t,n){var r=t.pendingProps;switch(t.tag){case 2:case 16:case 15:case 0:case 11:case 7:case 8:case 12:case 9:case 14:return null;case 1:return dt(t.type)&&Ut(),null;case 3:return Gr(),Ye(gt),Ye(ct),n=t.stateNode,n.pendingContext&&(n.context=n.pendingContext,n.pendingContext=null),e!==null&&e.child!==null||!xl(t)||(t.effectTag|=4),ea(t),null;case 5:Fs(t),n=pr(ei.current);var s=t.type;if(e!==null&&t.stateNode!=null)tu(e,t,s,r,n),e.ref!==t.ref&&(t.effectTag|=128);else{if(!r){if(t.stateNode===null)throw Error(h(166));return null}if(e=pr(en.current),xl(t)){r=t.stateNode,s=t.type;var d=t.memoizedProps;switch(r[Zt]=t,r[Dr]=d,s){case"iframe":case"object":case"embed":Ke("load",r);break;case"video":case"audio":for(e=0;e<Gn.length;e++)Ke(Gn[e],r);break;case"source":Ke("error",r);break;case"img":case"image":case"link":Ke("error",r),Ke("load",r);break;case"form":Ke("reset",r),Ke("submit",r);break;case"details":Ke("toggle",r);break;case"input":jl(r,d),Ke("invalid",r),Ft(n,"onChange");break;case"select":r._wrapperState={wasMultiple:!!d.multiple},Ke("invalid",r),Ft(n,"onChange");break;case"textarea":wi(r,d),Ke("invalid",r),Ft(n,"onChange")}Eo(s,d),e=null;for(var m in d)if(d.hasOwnProperty(m)){var v=d[m];m==="children"?typeof v=="string"?r.textContent!==v&&(e=["children",v]):typeof v=="number"&&r.textContent!==""+v&&(e=["children",""+v]):H.hasOwnProperty(m)&&v!=null&&Ft(n,m)}switch(s){case"input":Tt(r),Wl(r,d,!0);break;case"textarea":Tt(r),Ei(r);break;case"select":case"option":break;default:typeof d.onClick=="function"&&(r.onclick=nr)}n=e,t.updateQueue=n,n!==null&&(t.effectTag|=4)}else{switch(m=n.nodeType===9?n:n.ownerDocument,e===$i&&(e=ki(s)),e===$i?s==="script"?(e=m.createElement("div"),e.innerHTML="<script><\/script>",e=e.removeChild(e.firstChild)):typeof r.is=="string"?e=m.createElement(s,{is:r.is}):(e=m.createElement(s),s==="select"&&(m=e,r.multiple?m.multiple=!0:r.size&&(m.size=r.size))):e=m.createElementNS(e,s),e[Zt]=t,e[Dr]=r,eu(e,t,!1,!1),t.stateNode=e,m=bo(s,r),s){case"iframe":case"object":case"embed":Ke("load",e),v=r;break;case"video":case"audio":for(v=0;v<Gn.length;v++)Ke(Gn[v],e);v=r;break;case"source":Ke("error",e),v=r;break;case"img":case"image":case"link":Ke("error",e),Ke("load",e),v=r;break;case"form":Ke("reset",e),Ke("submit",e),v=r;break;case"details":Ke("toggle",e),v=r;break;case"input":jl(e,r),v=hi(e,r),Ke("invalid",e),Ft(n,"onChange");break;case"option":v=yi(e,r);break;case"select":e._wrapperState={wasMultiple:!!r.multiple},v=T({},r,{value:void 0}),Ke("invalid",e),Ft(n,"onChange");break;case"textarea":wi(e,r),v=Ci(e,r),Ke("invalid",e),Ft(n,"onChange");break;default:v=r}Eo(s,v);var L=v;for(d in L)if(L.hasOwnProperty(d)){var S=L[d];d==="style"?xo(e,S):d==="dangerouslySetInnerHTML"?(S=S?S.__html:void 0,S!=null&&_i(e,S)):d==="children"?typeof S=="string"?(s!=="textarea"||S!=="")&&Qn(e,S):typeof S=="number"&&Qn(e,""+S):d!=="suppressContentEditableWarning"&&d!=="suppressHydrationWarning"&&d!=="autoFocus"&&(H.hasOwnProperty(d)?S!=null&&Ft(n,d):S!=null&&no(e,d,S,m))}switch(s){case"input":Tt(e),Wl(e,r,!1);break;case"textarea":Tt(e),Ei(e);break;case"option":r.value!=null&&e.setAttribute("value",""+It(r.value));break;case"select":e.multiple=!!r.multiple,n=r.value,n!=null?Zn(e,!!r.multiple,n,!1):r.defaultValue!=null&&Zn(e,!!r.multiple,r.defaultValue,!0);break;default:typeof v.onClick=="function"&&(e.onclick=nr)}zi(s,r)&&(t.effectTag|=4)}t.ref!==null&&(t.effectTag|=128)}return null;case 6:if(e&&t.stateNode!=null)nu(e,t,e.memoizedProps,r);else{if(typeof r!="string"&&t.stateNode===null)throw Error(h(166));n=pr(ei.current),pr(en.current),xl(t)?(n=t.stateNode,r=t.memoizedProps,n[Zt]=t,n.nodeValue!==r&&(t.effectTag|=4)):(n=(n.nodeType===9?n:n.ownerDocument).createTextNode(r),n[Zt]=t,t.stateNode=n)}return null;case 13:return Ye(tt),r=t.memoizedState,t.effectTag&64?(t.expirationTime=n,t):(n=r!==null,r=!1,e===null?t.memoizedProps.fallback!==void 0&&xl(t):(s=e.memoizedState,r=s!==null,n||s===null||(s=e.child.sibling,s!==null&&(d=t.firstEffect,d!==null?(t.firstEffect=s,s.nextEffect=d):(t.firstEffect=t.lastEffect=s,s.nextEffect=null),s.effectTag=8))),n&&!r&&t.mode&2&&(e===null&&t.memoizedProps.unstable_avoidThisFallback!==!0||tt.current&1?ht===gr&&(ht=_l):((ht===gr||ht===_l)&&(ht=Ll),ni!==0&&Ot!==null&&(kr(Ot,St),Tu(Ot,ni)))),(n||r)&&(t.effectTag|=4),null);case 4:return Gr(),ea(t),null;case 10:return Xt(t),null;case 17:return dt(t.type)&&Ut(),null;case 19:if(Ye(tt),r=t.memoizedState,r===null)return null;if(s=(t.effectTag&64)!==0,d=r.rendering,d===null){if(s)El(r,!1);else if(ht!==gr||e!==null&&e.effectTag&64)for(d=t.child;d!==null;){if(e=ml(d),e!==null){for(t.effectTag|=64,El(r,!1),s=e.updateQueue,s!==null&&(t.updateQueue=s,t.effectTag|=4),r.lastEffect===null&&(t.firstEffect=null),t.lastEffect=r.lastEffect,r=t.child;r!==null;)s=r,d=n,s.effectTag&=2,s.nextEffect=null,s.firstEffect=null,s.lastEffect=null,e=s.alternate,e===null?(s.childExpirationTime=0,s.expirationTime=d,s.child=null,s.memoizedProps=null,s.memoizedState=null,s.updateQueue=null,s.dependencies=null):(s.childExpirationTime=e.childExpirationTime,s.expirationTime=e.expirationTime,s.child=e.child,s.memoizedProps=e.memoizedProps,s.memoizedState=e.memoizedState,s.updateQueue=e.updateQueue,d=e.dependencies,s.dependencies=d===null?null:{expirationTime:d.expirationTime,firstContext:d.firstContext,responders:d.responders}),r=r.sibling;return Je(tt,tt.current&1|2),t.child}d=d.sibling}}else{if(!s)if(e=ml(d),e!==null){if(t.effectTag|=64,s=!0,n=e.updateQueue,n!==null&&(t.updateQueue=n,t.effectTag|=4),El(r,!0),r.tail===null&&r.tailMode==="hidden"&&!d.alternate)return t=t.lastEffect=r.lastEffect,t!==null&&(t.nextEffect=null),null}else 2*j()-r.renderingStartTime>r.tailExpiration&&1<n&&(t.effectTag|=64,s=!0,El(r,!1),t.expirationTime=t.childExpirationTime=n-1);r.isBackwards?(d.sibling=t.child,t.child=d):(n=r.last,n!==null?n.sibling=d:t.child=d,r.last=d)}return r.tail!==null?(r.tailExpiration===0&&(r.tailExpiration=j()+500),n=r.tail,r.rendering=n,r.tail=n.sibling,r.lastEffect=t.lastEffect,r.renderingStartTime=j(),n.sibling=null,t=tt.current,Je(tt,s?t&1|2:t&1),n):null}throw Error(h(156,t.tag))}i(Au,"si");function Iu(e){switch(e.tag){case 1:dt(e.type)&&Ut();var t=e.effectTag;return t&4096?(e.effectTag=t&-4097|64,e):null;case 3:if(Gr(),Ye(gt),Ye(ct),t=e.effectTag,t&64)throw Error(h(285));return e.effectTag=t&-4097|64,e;case 5:return Fs(e),null;case 13:return Ye(tt),t=e.effectTag,t&4096?(e.effectTag=t&-4097|64,e):null;case 19:return Ye(tt),null;case 4:return Gr(),null;case 10:return Xt(e),null;default:return null}}i(Iu,"zi");function ta(e,t){return{value:e,source:t,stack:io(t)}}i(ta,"Ai");var Hu=typeof WeakSet=="function"?WeakSet:Set;function na(e,t){var n=t.source,r=t.stack;r===null&&n!==null&&(r=io(n)),n!==null&&At(n.type),t=t.value,e!==null&&e.tag===1&&At(e.type);try{console.error(t)}catch(s){setTimeout(function(){throw s})}}i(na,"Ci");function Fu(e,t){try{t.props=e.memoizedProps,t.state=e.memoizedState,t.componentWillUnmount()}catch(n){Er(e,n)}}i(Fu,"Di");function ru(e){var t=e.ref;if(t!==null)if(typeof t=="function")try{t(null)}catch(n){Er(e,n)}else t.current=null}i(ru,"Fi");function Vu(e,t){switch(t.tag){case 0:case 11:case 15:case 22:return;case 1:if(t.effectTag&256&&e!==null){var n=e.memoizedProps,r=e.memoizedState;e=t.stateNode,t=e.getSnapshotBeforeUpdate(t.elementType===t.type?n:Se(t.type,n),r),e.__reactInternalSnapshotBeforeUpdate=t}return;case 3:case 5:case 6:case 4:case 17:return}throw Error(h(163))}i(Vu,"Gi");function ou(e,t){if(t=t.updateQueue,t=t!==null?t.lastEffect:null,t!==null){var n=t=t.next;do{if((n.tag&e)===e){var r=n.destroy;n.destroy=void 0,r!==void 0&&r()}n=n.next}while(n!==t)}}i(ou,"Hi");function iu(e,t){if(t=t.updateQueue,t=t!==null?t.lastEffect:null,t!==null){var n=t=t.next;do{if((n.tag&e)===e){var r=n.create;n.destroy=r()}n=n.next}while(n!==t)}}i(iu,"Ii");function $u(e,t,n){switch(n.tag){case 0:case 11:case 15:case 22:iu(3,n);return;case 1:if(e=n.stateNode,n.effectTag&4)if(t===null)e.componentDidMount();else{var r=n.elementType===n.type?t.memoizedProps:Se(n.type,t.memoizedProps);e.componentDidUpdate(r,t.memoizedState,e.__reactInternalSnapshotBeforeUpdate)}t=n.updateQueue,t!==null&&Sa(n,t,e);return;case 3:if(t=n.updateQueue,t!==null){if(e=null,n.child!==null)switch(n.child.tag){case 5:e=n.child.stateNode;break;case 1:e=n.child.stateNode}Sa(n,t,e)}return;case 5:e=n.stateNode,t===null&&n.effectTag&4&&zi(n.type,n.memoizedProps)&&e.focus();return;case 6:return;case 4:return;case 12:return;case 13:n.memoizedState===null&&(n=n.alternate,n!==null&&(n=n.memoizedState,n!==null&&(n=n.dehydrated,n!==null&&er(n))));return;case 19:case 17:case 20:case 21:return}throw Error(h(163))}i($u,"Ji");function lu(e,t,n){switch(typeof pa=="function"&&pa(t),t.tag){case 0:case 11:case 14:case 15:case 22:if(e=t.updateQueue,e!==null&&(e=e.lastEffect,e!==null)){var r=e.next;ce(97<n?97:n,function(){var s=r;do{var d=s.destroy;if(d!==void 0){var m=t;try{d()}catch(v){Er(m,v)}}s=s.next}while(s!==r)})}break;case 1:ru(t),n=t.stateNode,typeof n.componentWillUnmount=="function"&&Fu(t,n);break;case 5:ru(t);break;case 4:cu(e,t,n)}}i(lu,"Ki");function su(e){var t=e.alternate;e.return=null,e.child=null,e.memoizedState=null,e.updateQueue=null,e.dependencies=null,e.alternate=null,e.firstEffect=null,e.lastEffect=null,e.pendingProps=null,e.memoizedProps=null,e.stateNode=null,t!==null&&su(t)}i(su,"Ni");function au(e){return e.tag===5||e.tag===3||e.tag===4}i(au,"Oi");function uu(e){e:{for(var t=e.return;t!==null;){if(au(t)){var n=t;break e}t=t.return}throw Error(h(160))}switch(t=n.stateNode,n.tag){case 5:var r=!1;break;case 3:t=t.containerInfo,r=!0;break;case 4:t=t.containerInfo,r=!0;break;default:throw Error(h(161))}n.effectTag&16&&(Qn(t,""),n.effectTag&=-17);e:t:for(n=e;;){for(;n.sibling===null;){if(n.return===null||au(n.return)){n=null;break e}n=n.return}for(n.sibling.return=n.return,n=n.sibling;n.tag!==5&&n.tag!==6&&n.tag!==18;){if(n.effectTag&2||n.child===null||n.tag===4)continue t;n.child.return=n,n=n.child}if(!(n.effectTag&2)){n=n.stateNode;break e}}r?ra(e,n,t):oa(e,n,t)}i(uu,"Pi");function ra(e,t,n){var r=e.tag,s=r===5||r===6;if(s)e=s?e.stateNode:e.stateNode.instance,t?n.nodeType===8?n.parentNode.insertBefore(e,t):n.insertBefore(e,t):(n.nodeType===8?(t=n.parentNode,t.insertBefore(e,n)):(t=n,t.appendChild(e)),n=n._reactRootContainer,n!=null||t.onclick!==null||(t.onclick=nr));else if(r!==4&&(e=e.child,e!==null))for(ra(e,t,n),e=e.sibling;e!==null;)ra(e,t,n),e=e.sibling}i(ra,"Qi");function oa(e,t,n){var r=e.tag,s=r===5||r===6;if(s)e=s?e.stateNode:e.stateNode.instance,t?n.insertBefore(e,t):n.appendChild(e);else if(r!==4&&(e=e.child,e!==null))for(oa(e,t,n),e=e.sibling;e!==null;)oa(e,t,n),e=e.sibling}i(oa,"Ri");function cu(e,t,n){for(var r=t,s=!1,d,m;;){if(!s){s=r.return;e:for(;;){if(s===null)throw Error(h(160));switch(d=s.stateNode,s.tag){case 5:m=!1;break e;case 3:d=d.containerInfo,m=!0;break e;case 4:d=d.containerInfo,m=!0;break e}s=s.return}s=!0}if(r.tag===5||r.tag===6){e:for(var v=e,L=r,S=n,ne=L;;)if(lu(v,ne,S),ne.child!==null&&ne.tag!==4)ne.child.return=ne,ne=ne.child;else{if(ne===L)break e;for(;ne.sibling===null;){if(ne.return===null||ne.return===L)break e;ne=ne.return}ne.sibling.return=ne.return,ne=ne.sibling}m?(v=d,L=r.stateNode,v.nodeType===8?v.parentNode.removeChild(L):v.removeChild(L)):d.removeChild(r.stateNode)}else if(r.tag===4){if(r.child!==null){d=r.stateNode.containerInfo,m=!0,r.child.return=r,r=r.child;continue}}else if(lu(e,r,n),r.child!==null){r.child.return=r,r=r.child;continue}if(r===t)break;for(;r.sibling===null;){if(r.return===null||r.return===t)return;r=r.return,r.tag===4&&(s=!1)}r.sibling.return=r.return,r=r.sibling}}i(cu,"Mi");function ia(e,t){switch(t.tag){case 0:case 11:case 14:case 15:case 22:ou(3,t);return;case 1:return;case 5:var n=t.stateNode;if(n!=null){var r=t.memoizedProps,s=e!==null?e.memoizedProps:r;e=t.type;var d=t.updateQueue;if(t.updateQueue=null,d!==null){for(n[Dr]=r,e==="input"&&r.type==="radio"&&r.name!=null&&Ul(n,r),bo(e,s),t=bo(e,r),s=0;s<d.length;s+=2){var m=d[s],v=d[s+1];m==="style"?xo(n,v):m==="dangerouslySetInnerHTML"?_i(n,v):m==="children"?Qn(n,v):no(n,m,v,t)}switch(e){case"input":vi(n,r);break;case"textarea":xi(n,r);break;case"select":t=n._wrapperState.wasMultiple,n._wrapperState.wasMultiple=!!r.multiple,e=r.value,e!=null?Zn(n,!!r.multiple,e,!1):t!==!!r.multiple&&(r.defaultValue!=null?Zn(n,!!r.multiple,r.defaultValue,!0):Zn(n,!!r.multiple,r.multiple?[]:"",!1))}}}return;case 6:if(t.stateNode===null)throw Error(h(162));t.stateNode.nodeValue=t.memoizedProps;return;case 3:t=t.stateNode,t.hydrate&&(t.hydrate=!1,er(t.containerInfo));return;case 12:return;case 13:if(n=t,t.memoizedState===null?r=!1:(r=!0,n=t.child,aa=j()),n!==null)e:for(e=n;;){if(e.tag===5)d=e.stateNode,r?(d=d.style,typeof d.setProperty=="function"?d.setProperty("display","none","important"):d.display="none"):(d=e.stateNode,s=e.memoizedProps.style,s=s!=null&&s.hasOwnProperty("display")?s.display:null,d.style.display=Vi("display",s));else if(e.tag===6)e.stateNode.nodeValue=r?"":e.memoizedProps;else if(e.tag===13&&e.memoizedState!==null&&e.memoizedState.dehydrated===null){d=e.child.sibling,d.return=e,e=d;continue}else if(e.child!==null){e.child.return=e,e=e.child;continue}if(e===n)break;for(;e.sibling===null;){if(e.return===null||e.return===n)break e;e=e.return}e.sibling.return=e.return,e=e.sibling}du(t);return;case 19:du(t);return;case 17:return}throw Error(h(163))}i(ia,"Si");function du(e){var t=e.updateQueue;if(t!==null){e.updateQueue=null;var n=e.stateNode;n===null&&(n=e.stateNode=new Hu),t.forEach(function(r){var s=Yu.bind(null,e,r);n.has(r)||(n.add(r),r.then(s,s))})}}i(du,"Ui");var zu=typeof WeakMap=="function"?WeakMap:Map;function fu(e,t,n){n=Jt(n,null),n.tag=3,n.payload={element:null};var r=t.value;return n.callback=function(){Nl||(Nl=!0,ua=r),na(e,t)},n}i(fu,"Xi");function mu(e,t,n){n=Jt(n,null),n.tag=3;var r=e.type.getDerivedStateFromError;if(typeof r=="function"){var s=t.value;n.payload=function(){return na(e,t),r(s)}}var d=e.stateNode;return d!==null&&typeof d.componentDidCatch=="function"&&(n.callback=function(){typeof r!="function"&&($n===null?$n=new Set([this]):$n.add(this),na(e,t));var m=t.stack;this.componentDidCatch(t.value,{componentStack:m!==null?m:""})}),n}i(mu,"$i");var Bu=Math.ceil,bl=_t.ReactCurrentDispatcher,pu=_t.ReactCurrentOwner,pt=0,la=8,Wt=16,nn=32,gr=0,kl=1,hu=2,_l=3,Ll=4,sa=5,_e=pt,Ot=null,Re=null,St=0,ht=gr,Sl=null,Cn=1073741823,ti=1073741823,Tl=null,ni=0,Ml=!1,aa=0,vu=500,fe=null,Nl=!1,ua=null,$n=null,Rl=!1,ri=null,oi=90,yr=null,ii=0,ca=null,Pl=0;function rn(){return(_e&(Wt|nn))!==pt?1073741821-(j()/10|0):Pl!==0?Pl:Pl=1073741821-(j()/10|0)}i(rn,"Gg");function Cr(e,t,n){if(t=t.mode,!(t&2))return 1073741823;var r=z();if(!(t&4))return r===99?1073741823:1073741822;if((_e&Wt)!==pt)return St;if(n!==null)e=Ue(e,n.timeoutMs|0||5e3,250);else switch(r){case 99:e=1073741823;break;case 98:e=Ue(e,150,100);break;case 97:case 96:e=Ue(e,5e3,250);break;case 95:e=2;break;default:throw Error(h(326))}return Ot!==null&&e===St&&--e,e}i(Cr,"Hg");function zn(e,t){if(50<ii)throw ii=0,ca=null,Error(h(185));if(e=Ol(e,t),e!==null){var n=z();t===1073741823?(_e&la)!==pt&&(_e&(Wt|nn))===pt?da(e):(Dt(e),_e===pt&&pe()):Dt(e),(_e&4)===pt||n!==98&&n!==99||(yr===null?yr=new Map([[e,t]]):(n=yr.get(e),(n===void 0||n>t)&&yr.set(e,t)))}}i(zn,"Ig");function Ol(e,t){e.expirationTime<t&&(e.expirationTime=t);var n=e.alternate;n!==null&&n.expirationTime<t&&(n.expirationTime=t);var r=e.return,s=null;if(r===null&&e.tag===3)s=e.stateNode;else for(;r!==null;){if(n=r.alternate,r.childExpirationTime<t&&(r.childExpirationTime=t),n!==null&&n.childExpirationTime<t&&(n.childExpirationTime=t),r.return===null&&r.tag===3){s=r.stateNode;break}r=r.return}return s!==null&&(Ot===s&&(Al(t),ht===Ll&&kr(s,St)),Tu(s,t)),s}i(Ol,"xj");function Dl(e){var t=e.lastExpiredTime;if(t!==0||(t=e.firstPendingTime,!Su(e,t)))return t;var n=e.lastPingedTime;return e=e.nextKnownPendingLevel,e=n>e?n:e,2>=e&&t!==e?0:e}i(Dl,"zj");function Dt(e){if(e.lastExpiredTime!==0)e.callbackExpirationTime=1073741823,e.callbackPriority=99,e.callbackNode=Ne(da.bind(null,e));else{var t=Dl(e),n=e.callbackNode;if(t===0)n!==null&&(e.callbackNode=null,e.callbackExpirationTime=0,e.callbackPriority=90);else{var r=rn();if(t===1073741823?r=99:t===1||t===2?r=95:(r=10*(1073741821-t)-10*(1073741821-r),r=0>=r?99:250>=r?98:5250>=r?97:95),n!==null){var s=e.callbackPriority;if(e.callbackExpirationTime===t&&s>=r)return;n!==c&&Zr(n)}e.callbackExpirationTime=t,e.callbackPriority=r,t=t===1073741823?Ne(da.bind(null,e)):A(r,gu.bind(null,e),{timeout:10*(1073741821-t)-j()}),e.callbackNode=t}}}i(Dt,"Z");function gu(e,t){if(Pl=0,t)return t=rn(),ya(e,t),Dt(e),null;var n=Dl(e);if(n!==0){if(t=e.callbackNode,(_e&(Wt|nn))!==pt)throw Error(h(327));if(eo(),e===Ot&&n===St||wr(e,n),Re!==null){var r=_e;_e|=Wt;var s=xu();do try{Wu();break}catch(v){wu(e,v)}while(!0);if(ft(),_e=r,bl.current=s,ht===kl)throw t=Sl,wr(e,n),kr(e,n),Dt(e),t;if(Re===null)switch(s=e.finishedWork=e.current.alternate,e.finishedExpirationTime=n,r=ht,Ot=null,r){case gr:case kl:throw Error(h(345));case hu:ya(e,2<n?2:n);break;case _l:if(kr(e,n),r=e.lastSuspendedTime,n===r&&(e.nextKnownPendingLevel=fa(s)),Cn===1073741823&&(s=aa+vu-j(),10<s)){if(Ml){var d=e.lastPingedTime;if(d===0||d>=n){e.lastPingedTime=n,wr(e,n);break}}if(d=Dl(e),d!==0&&d!==n)break;if(r!==0&&r!==n){e.lastPingedTime=r;break}e.timeoutHandle=Po(xr.bind(null,e),s);break}xr(e);break;case Ll:if(kr(e,n),r=e.lastSuspendedTime,n===r&&(e.nextKnownPendingLevel=fa(s)),Ml&&(s=e.lastPingedTime,s===0||s>=n)){e.lastPingedTime=n,wr(e,n);break}if(s=Dl(e),s!==0&&s!==n)break;if(r!==0&&r!==n){e.lastPingedTime=r;break}if(ti!==1073741823?r=10*(1073741821-ti)-j():Cn===1073741823?r=0:(r=10*(1073741821-Cn)-5e3,s=j(),n=10*(1073741821-n)-s,r=s-r,0>r&&(r=0),r=(120>r?120:480>r?480:1080>r?1080:1920>r?1920:3e3>r?3e3:4320>r?4320:1960*Bu(r/1960))-r,n<r&&(r=n)),10<r){e.timeoutHandle=Po(xr.bind(null,e),r);break}xr(e);break;case sa:if(Cn!==1073741823&&Tl!==null){d=Cn;var m=Tl;if(r=m.busyMinDurationMs|0,0>=r?r=0:(s=m.busyDelayMs|0,d=j()-(10*(1073741821-d)-(m.timeoutMs|0||5e3)),r=d<=s?0:s+r-d),10<r){kr(e,n),e.timeoutHandle=Po(xr.bind(null,e),r);break}}xr(e);break;default:throw Error(h(329))}if(Dt(e),e.callbackNode===t)return gu.bind(null,e)}}return null}i(gu,"Bj");function da(e){var t=e.lastExpiredTime;if(t=t!==0?t:1073741823,(_e&(Wt|nn))!==pt)throw Error(h(327));if(eo(),e===Ot&&t===St||wr(e,t),Re!==null){var n=_e;_e|=Wt;var r=xu();do try{Uu();break}catch(s){wu(e,s)}while(!0);if(ft(),_e=n,bl.current=r,ht===kl)throw n=Sl,wr(e,t),kr(e,t),Dt(e),n;if(Re!==null)throw Error(h(261));e.finishedWork=e.current.alternate,e.finishedExpirationTime=t,Ot=null,xr(e),Dt(e)}return null}i(da,"yj");function ju(){if(yr!==null){var e=yr;yr=null,e.forEach(function(t,n){ya(n,t),Dt(n)}),pe()}}i(ju,"Lj");function yu(e,t){var n=_e;_e|=1;try{return e(t)}finally{_e=n,_e===pt&&pe()}}i(yu,"Mj");function Cu(e,t){var n=_e;_e&=-2,_e|=la;try{return e(t)}finally{_e=n,_e===pt&&pe()}}i(Cu,"Nj");function wr(e,t){e.finishedWork=null,e.finishedExpirationTime=0;var n=e.timeoutHandle;if(n!==-1&&(e.timeoutHandle=-1,ls(n)),Re!==null)for(n=Re.return;n!==null;){var r=n;switch(r.tag){case 1:r=r.type.childContextTypes,r!=null&&Ut();break;case 3:Gr(),Ye(gt),Ye(ct);break;case 5:Fs(r);break;case 4:Gr();break;case 13:Ye(tt);break;case 19:Ye(tt);break;case 10:Xt(r)}n=n.return}Ot=e,Re=br(e.current,null),St=t,ht=gr,Sl=null,ti=Cn=1073741823,Tl=null,ni=0,Ml=!1}i(wr,"Ej");function wu(e,t){do{try{if(ft(),pl.current=wl,hl)for(var n=st.memoizedState;n!==null;){var r=n.queue;r!==null&&(r.pending=null),n=n.next}if(Fn=0,Et=xt=st=null,hl=!1,Re===null||Re.return===null)return ht=kl,Sl=t,Re=null;e:{var s=e,d=Re.return,m=Re,v=t;if(t=St,m.effectTag|=2048,m.firstEffect=m.lastEffect=null,v!==null&&typeof v=="object"&&typeof v.then=="function"){var L=v;if(!(m.mode&2)){var S=m.alternate;S?(m.updateQueue=S.updateQueue,m.memoizedState=S.memoizedState,m.expirationTime=S.expirationTime):(m.updateQueue=null,m.memoizedState=null)}var ne=(tt.current&1)!==0,se=d;do{var Fe;if(Fe=se.tag===13){var We=se.memoizedState;if(We!==null)Fe=We.dehydrated!==null;else{var $t=se.memoizedProps;Fe=$t.fallback===void 0?!1:$t.unstable_avoidThisFallback!==!0?!0:!ne}}if(Fe){var Ct=se.updateQueue;if(Ct===null){var b=new Set;b.add(L),se.updateQueue=b}else Ct.add(L);if(!(se.mode&2)){if(se.effectTag|=64,m.effectTag&=-2981,m.tag===1)if(m.alternate===null)m.tag=17;else{var x=Jt(1073741823,null);x.tag=2,Hn(m,x)}m.expirationTime=1073741823;break e}v=void 0,m=t;var M=s.pingCache;if(M===null?(M=s.pingCache=new zu,v=new Set,M.set(L,v)):(v=M.get(L),v===void 0&&(v=new Set,M.set(L,v))),!v.has(m)){v.add(m);var q=Ku.bind(null,s,L,m);L.then(q,q)}se.effectTag|=4096,se.expirationTime=t;break e}se=se.return}while(se!==null);v=Error((At(m.type)||"A React component")+` suspended while rendering, but no fallback UI was specified.

Add a <Suspense fallback=...> component higher in the tree to provide a loading indicator or placeholder to display.`+io(m))}ht!==sa&&(ht=hu),v=ta(v,m),se=d;do{switch(se.tag){case 3:L=v,se.effectTag|=4096,se.expirationTime=t;var te=fu(se,L,t);La(se,te);break e;case 1:L=v;var ae=se.type,xe=se.stateNode;if(!(se.effectTag&64)&&(typeof ae.getDerivedStateFromError=="function"||xe!==null&&typeof xe.componentDidCatch=="function"&&($n===null||!$n.has(xe)))){se.effectTag|=4096,se.expirationTime=t;var $e=mu(se,L,t);La(se,$e);break e}}se=se.return}while(se!==null)}Re=ku(Re)}catch(et){t=et;continue}break}while(!0)}i(wu,"Hj");function xu(){var e=bl.current;return bl.current=wl,e===null?wl:e}i(xu,"Fj");function Eu(e,t){e<Cn&&2<e&&(Cn=e),t!==null&&e<ti&&2<e&&(ti=e,Tl=t)}i(Eu,"Ag");function Al(e){e>ni&&(ni=e)}i(Al,"Bg");function Uu(){for(;Re!==null;)Re=bu(Re)}i(Uu,"Kj");function Wu(){for(;Re!==null&&!f();)Re=bu(Re)}i(Wu,"Gj");function bu(e){var t=Lu(e.alternate,e,St);return e.memoizedProps=e.pendingProps,t===null&&(t=ku(e)),pu.current=null,t}i(bu,"Qj");function ku(e){Re=e;do{var t=Re.alternate;if(e=Re.return,Re.effectTag&2048){if(t=Iu(Re),t!==null)return t.effectTag&=2047,t;e!==null&&(e.firstEffect=e.lastEffect=null,e.effectTag|=2048)}else{if(t=Au(t,Re,St),St===1||Re.childExpirationTime!==1){for(var n=0,r=Re.child;r!==null;){var s=r.expirationTime,d=r.childExpirationTime;s>n&&(n=s),d>n&&(n=d),r=r.sibling}Re.childExpirationTime=n}if(t!==null)return t;e!==null&&!(e.effectTag&2048)&&(e.firstEffect===null&&(e.firstEffect=Re.firstEffect),Re.lastEffect!==null&&(e.lastEffect!==null&&(e.lastEffect.nextEffect=Re.firstEffect),e.lastEffect=Re.lastEffect),1<Re.effectTag&&(e.lastEffect!==null?e.lastEffect.nextEffect=Re:e.firstEffect=Re,e.lastEffect=Re))}if(t=Re.sibling,t!==null)return t;Re=e}while(Re!==null);return ht===gr&&(ht=sa),null}i(ku,"Pj");function fa(e){var t=e.expirationTime;return e=e.childExpirationTime,t>e?t:e}i(fa,"Ij");function xr(e){var t=z();return ce(99,qu.bind(null,e,t)),null}i(xr,"Jj");function qu(e,t){do eo();while(ri!==null);if((_e&(Wt|nn))!==pt)throw Error(h(327));var n=e.finishedWork,r=e.finishedExpirationTime;if(n===null)return null;if(e.finishedWork=null,e.finishedExpirationTime=0,n===e.current)throw Error(h(177));e.callbackNode=null,e.callbackExpirationTime=0,e.callbackPriority=90,e.nextKnownPendingLevel=0;var s=fa(n);if(e.firstPendingTime=s,r<=e.lastSuspendedTime?e.firstSuspendedTime=e.lastSuspendedTime=e.nextKnownPendingLevel=0:r<=e.firstSuspendedTime&&(e.firstSuspendedTime=r-1),r<=e.lastPingedTime&&(e.lastPingedTime=0),r<=e.lastExpiredTime&&(e.lastExpiredTime=0),e===Ot&&(Re=Ot=null,St=0),1<n.effectTag?n.lastEffect!==null?(n.lastEffect.nextEffect=n,s=n.firstEffect):s=n:s=n.firstEffect,s!==null){var d=_e;_e|=nn,pu.current=null,Mo=wo;var m=is();if(Lo(m)){if("selectionStart"in m)var v={start:m.selectionStart,end:m.selectionEnd};else e:{v=(v=m.ownerDocument)&&v.defaultView||window;var L=v.getSelection&&v.getSelection();if(L&&L.rangeCount!==0){v=L.anchorNode;var S=L.anchorOffset,ne=L.focusNode;L=L.focusOffset;try{v.nodeType,ne.nodeType}catch{v=null;break e}var se=0,Fe=-1,We=-1,$t=0,Ct=0,b=m,x=null;t:for(;;){for(var M;b!==v||S!==0&&b.nodeType!==3||(Fe=se+S),b!==ne||L!==0&&b.nodeType!==3||(We=se+L),b.nodeType===3&&(se+=b.nodeValue.length),(M=b.firstChild)!==null;)x=b,b=M;for(;;){if(b===m)break t;if(x===v&&++$t===S&&(Fe=se),x===ne&&++Ct===L&&(We=se),(M=b.nextSibling)!==null)break;b=x,x=b.parentNode}b=M}v=Fe===-1||We===-1?null:{start:Fe,end:We}}else v=null}v=v||{start:0,end:0}}else v=null;No={activeElementDetached:null,focusedElem:m,selectionRange:v},wo=!1,fe=s;do try{Zu()}catch(Oe){if(fe===null)throw Error(h(330));Er(fe,Oe),fe=fe.nextEffect}while(fe!==null);fe=s;do try{for(m=e,v=t;fe!==null;){var q=fe.effectTag;if(q&16&&Qn(fe.stateNode,""),q&128){var te=fe.alternate;if(te!==null){var ae=te.ref;ae!==null&&(typeof ae=="function"?ae(null):ae.current=null)}}switch(q&1038){case 2:uu(fe),fe.effectTag&=-3;break;case 6:uu(fe),fe.effectTag&=-3,ia(fe.alternate,fe);break;case 1024:fe.effectTag&=-1025;break;case 1028:fe.effectTag&=-1025,ia(fe.alternate,fe);break;case 4:ia(fe.alternate,fe);break;case 8:S=fe,cu(m,S,v),su(S)}fe=fe.nextEffect}}catch(Oe){if(fe===null)throw Error(h(330));Er(fe,Oe),fe=fe.nextEffect}while(fe!==null);if(ae=No,te=is(),q=ae.focusedElem,v=ae.selectionRange,te!==q&&q&&q.ownerDocument&&_o(q.ownerDocument.documentElement,q)){for(v!==null&&Lo(q)&&(te=v.start,ae=v.end,ae===void 0&&(ae=te),"selectionStart"in q?(q.selectionStart=te,q.selectionEnd=Math.min(ae,q.value.length)):(ae=(te=q.ownerDocument||document)&&te.defaultView||window,ae.getSelection&&(ae=ae.getSelection(),S=q.textContent.length,m=Math.min(v.start,S),v=v.end===void 0?m:Math.min(v.end,S),!ae.extend&&m>v&&(S=v,v=m,m=S),S=os(q,m),ne=os(q,v),S&&ne&&(ae.rangeCount!==1||ae.anchorNode!==S.node||ae.anchorOffset!==S.offset||ae.focusNode!==ne.node||ae.focusOffset!==ne.offset)&&(te=te.createRange(),te.setStart(S.node,S.offset),ae.removeAllRanges(),m>v?(ae.addRange(te),ae.extend(ne.node,ne.offset)):(te.setEnd(ne.node,ne.offset),ae.addRange(te)))))),te=[],ae=q;ae=ae.parentNode;)ae.nodeType===1&&te.push({element:ae,left:ae.scrollLeft,top:ae.scrollTop});for(typeof q.focus=="function"&&q.focus(),q=0;q<te.length;q++)ae=te[q],ae.element.scrollLeft=ae.left,ae.element.scrollTop=ae.top}wo=!!Mo,No=Mo=null,e.current=n,fe=s;do try{for(q=e;fe!==null;){var xe=fe.effectTag;if(xe&36&&$u(q,fe.alternate,fe),xe&128){te=void 0;var $e=fe.ref;if($e!==null){var et=fe.stateNode;switch(fe.tag){case 5:te=et;break;default:te=et}typeof $e=="function"?$e(te):$e.current=te}}fe=fe.nextEffect}}catch(Oe){if(fe===null)throw Error(h(330));Er(fe,Oe),fe=fe.nextEffect}while(fe!==null);fe=null,p(),_e=d}else e.current=n;if(Rl)Rl=!1,ri=e,oi=t;else for(fe=s;fe!==null;)t=fe.nextEffect,fe.nextEffect=null,fe=t;if(t=e.firstPendingTime,t===0&&($n=null),t===1073741823?e===ca?ii++:(ii=0,ca=e):ii=0,typeof ma=="function"&&ma(n.stateNode,r),Dt(e),Nl)throw Nl=!1,e=ua,ua=null,e;return(_e&la)!==pt||pe(),null}i(qu,"Sj");function Zu(){for(;fe!==null;){var e=fe.effectTag;e&256&&Vu(fe.alternate,fe),!(e&512)||Rl||(Rl=!0,A(97,function(){return eo(),null})),fe=fe.nextEffect}}i(Zu,"Tj");function eo(){if(oi!==90){var e=97<oi?97:oi;return oi=90,ce(e,Qu)}}i(eo,"Dj");function Qu(){if(ri===null)return!1;var e=ri;if(ri=null,(_e&(Wt|nn))!==pt)throw Error(h(331));var t=_e;for(_e|=nn,e=e.current.firstEffect;e!==null;){try{var n=e;if(n.effectTag&512)switch(n.tag){case 0:case 11:case 15:case 22:ou(5,n),iu(5,n)}}catch(r){if(e===null)throw Error(h(330));Er(e,r)}n=e.nextEffect,e.nextEffect=null,e=n}return _e=t,pe(),!0}i(Qu,"Vj");function _u(e,t,n){t=ta(n,t),t=fu(e,t,1073741823),Hn(e,t),e=Ol(e,1073741823),e!==null&&Dt(e)}i(_u,"Wj");function Er(e,t){if(e.tag===3)_u(e,e,t);else for(var n=e.return;n!==null;){if(n.tag===3){_u(n,e,t);break}else if(n.tag===1){var r=n.stateNode;if(typeof n.type.getDerivedStateFromError=="function"||typeof r.componentDidCatch=="function"&&($n===null||!$n.has(r))){e=ta(t,e),e=mu(n,e,1073741823),Hn(n,e),n=Ol(n,1073741823),n!==null&&Dt(n);break}}n=n.return}}i(Er,"Ei");function Ku(e,t,n){var r=e.pingCache;r!==null&&r.delete(t),Ot===e&&St===n?ht===Ll||ht===_l&&Cn===1073741823&&j()-aa<vu?wr(e,St):Ml=!0:Su(e,n)&&(t=e.lastPingedTime,t!==0&&t<n||(e.lastPingedTime=n,Dt(e)))}i(Ku,"Oj");function Yu(e,t){var n=e.stateNode;n!==null&&n.delete(t),t=0,t===0&&(t=rn(),t=Cr(t,e,null)),e=Ol(e,t),e!==null&&Dt(e)}i(Yu,"Vi");var Lu;Lu=i(function(e,t,n){var r=t.expirationTime;if(e!==null){var s=t.pendingProps;if(e.memoizedProps!==s||gt.current)tn=!0;else{if(r<n){switch(tn=!1,t.tag){case 3:Ya(t),Ks();break;case 5:if(Oa(t),t.mode&4&&n!==1&&s.hidden)return t.expirationTime=t.childExpirationTime=1,null;break;case 1:dt(t.type)&&An(t);break;case 4:Hs(t,t.stateNode.containerInfo);break;case 10:r=t.memoizedProps.value,s=t.type._context,Je(Te,s._currentValue),s._currentValue=r;break;case 13:if(t.memoizedState!==null)return r=t.child.childExpirationTime,r!==0&&r>=n?Ga(e,t,n):(Je(tt,tt.current&1),t=yn(e,t,n),t!==null?t.sibling:null);Je(tt,tt.current&1);break;case 19:if(r=t.childExpirationTime>=n,e.effectTag&64){if(r)return Ja(e,t,n);t.effectTag|=64}if(s=t.memoizedState,s!==null&&(s.rendering=null,s.tail=null),Je(tt,tt.current),!r)return null}return yn(e,t,n)}tn=!1}}else tn=!1;switch(t.expirationTime=0,t.tag){case 2:if(r=t.type,e!==null&&(e.alternate=null,t.alternate=null,t.effectTag|=2),e=t.pendingProps,s=Dn(t,ct.current),lt(t,n),s=zs(null,t,r,e,s,n),t.effectTag|=1,typeof s=="object"&&s!==null&&typeof s.render=="function"&&s.$$typeof===void 0){if(t.tag=1,t.memoizedState=null,t.updateQueue=null,dt(r)){var d=!0;An(t)}else d=!1;t.memoizedState=s.state!==null&&s.state!==void 0?s.state:null,Lt(t);var m=r.getDerivedStateFromProps;typeof m=="function"&&ul(t,r,m,e),s.updater=cl,t.stateNode=s,s._reactInternalFiber=t,As(t,r,e,n),t=Gs(null,t,r,!0,d,n)}else t.tag=0,Pt(null,t,s,n),t=t.child;return t;case 16:e:{if(s=t.elementType,e!==null&&(e.alternate=null,t.alternate=null,t.effectTag|=2),e=t.pendingProps,Bl(s),s._status!==1)throw s._result;switch(s=s._result,t.type=s,d=t.tag=Ju(s),e=Se(s,e),d){case 0:t=Ys(null,t,s,e,n);break e;case 1:t=Ka(null,t,s,e,n);break e;case 11:t=Wa(null,t,s,e,n);break e;case 14:t=qa(null,t,s,Se(s.type,e),r,n);break e}throw Error(h(306,s,""))}return t;case 0:return r=t.type,s=t.pendingProps,s=t.elementType===r?s:Se(r,s),Ys(e,t,r,s,n);case 1:return r=t.type,s=t.pendingProps,s=t.elementType===r?s:Se(r,s),Ka(e,t,r,s,n);case 3:if(Ya(t),r=t.updateQueue,e===null||r===null)throw Error(h(282));if(r=t.pendingProps,s=t.memoizedState,s=s!==null?s.element:null,Kr(e,t),Ko(t,r,null,n),r=t.memoizedState.element,r===s)Ks(),t=yn(e,t,n);else{if((s=t.stateNode.hydrate)&&(Vn=Sn(t.stateNode.containerInfo.firstChild),gn=t,s=vr=!0),s)for(n=Is(t,null,r,n),t.child=n;n;)n.effectTag=n.effectTag&-3|1024,n=n.sibling;else Pt(e,t,r,n),Ks();t=t.child}return t;case 5:return Oa(t),e===null&&Qs(t),r=t.type,s=t.pendingProps,d=e!==null?e.memoizedProps:null,m=s.children,Ro(r,s)?m=null:d!==null&&Ro(r,d)&&(t.effectTag|=16),Qa(e,t),t.mode&4&&n!==1&&s.hidden?(t.expirationTime=t.childExpirationTime=1,t=null):(Pt(e,t,m,n),t=t.child),t;case 6:return e===null&&Qs(t),null;case 13:return Ga(e,t,n);case 4:return Hs(t,t.stateNode.containerInfo),r=t.pendingProps,e===null?t.child=Yr(t,null,r,n):Pt(e,t,r,n),t.child;case 11:return r=t.type,s=t.pendingProps,s=t.elementType===r?s:Se(r,s),Wa(e,t,r,s,n);case 7:return Pt(e,t,t.pendingProps,n),t.child;case 8:return Pt(e,t,t.pendingProps.children,n),t.child;case 12:return Pt(e,t,t.pendingProps.children,n),t.child;case 10:e:{r=t.type._context,s=t.pendingProps,m=t.memoizedProps,d=s.value;var v=t.type._context;if(Je(Te,v._currentValue),v._currentValue=d,m!==null)if(v=m.value,d=Rn(v,d)?0:(typeof r._calculateChangedBits=="function"?r._calculateChangedBits(v,d):1073741823)|0,d===0){if(m.children===s.children&&!gt.current){t=yn(e,t,n);break e}}else for(v=t.child,v!==null&&(v.return=t);v!==null;){var L=v.dependencies;if(L!==null){m=v.child;for(var S=L.firstContext;S!==null;){if(S.context===r&&S.observedBits&d){v.tag===1&&(S=Jt(n,null),S.tag=2,Hn(v,S)),v.expirationTime<n&&(v.expirationTime=n),S=v.alternate,S!==null&&S.expirationTime<n&&(S.expirationTime=n),mt(v.return,n),L.expirationTime<n&&(L.expirationTime=n);break}S=S.next}}else m=v.tag===10&&v.type===t.type?null:v.child;if(m!==null)m.return=v;else for(m=v;m!==null;){if(m===t){m=null;break}if(v=m.sibling,v!==null){v.return=m.return,m=v;break}m=m.return}v=m}Pt(e,t,s.children,n),t=t.child}return t;case 9:return s=t.type,d=t.pendingProps,r=d.children,lt(t,n),s=yt(s,d.unstable_observedBits),r=r(s),t.effectTag|=1,Pt(e,t,r,n),t.child;case 14:return s=t.type,d=Se(s,t.pendingProps),d=Se(s.type,d),qa(e,t,s,d,r,n);case 15:return Za(e,t,t.type,t.pendingProps,r,n);case 17:return r=t.type,s=t.pendingProps,s=t.elementType===r?s:Se(r,s),e!==null&&(e.alternate=null,t.alternate=null,t.effectTag|=2),t.tag=1,dt(r)?(e=!0,An(t)):e=!1,lt(t,n),Na(t,r,s),As(t,r,s,n),Gs(null,t,r,!0,e,n);case 19:return Ja(e,t,n)}throw Error(h(156,t.tag))},"Rj");var ma=null,pa=null;function Gu(e){if(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__=="undefined")return!1;var t=__REACT_DEVTOOLS_GLOBAL_HOOK__;if(t.isDisabled||!t.supportsFiber)return!0;try{var n=t.inject(e);ma=i(function(r){try{t.onCommitFiberRoot(n,r,void 0,(r.current.effectTag&64)===64)}catch{}},"Uj"),pa=i(function(r){try{t.onCommitFiberUnmount(n,r)}catch{}},"Li")}catch{}return!0}i(Gu,"Yj");function Xu(e,t,n,r){this.tag=e,this.key=n,this.sibling=this.child=this.return=this.stateNode=this.type=this.elementType=null,this.index=0,this.ref=null,this.pendingProps=t,this.dependencies=this.memoizedState=this.updateQueue=this.memoizedProps=null,this.mode=r,this.effectTag=0,this.lastEffect=this.firstEffect=this.nextEffect=null,this.childExpirationTime=this.expirationTime=0,this.alternate=null}i(Xu,"Zj");function on(e,t,n,r){return new Xu(e,t,n,r)}i(on,"Sh");function ha(e){return e=e.prototype,!(!e||!e.isReactComponent)}i(ha,"bi");function Ju(e){if(typeof e=="function")return ha(e)?1:0;if(e!=null){if(e=e.$$typeof,e===ro)return 11;if(e===oo)return 14}return 2}i(Ju,"Xj");function br(e,t){var n=e.alternate;return n===null?(n=on(e.tag,t,e.key,e.mode),n.elementType=e.elementType,n.type=e.type,n.stateNode=e.stateNode,n.alternate=e,e.alternate=n):(n.pendingProps=t,n.effectTag=0,n.nextEffect=null,n.firstEffect=null,n.lastEffect=null),n.childExpirationTime=e.childExpirationTime,n.expirationTime=e.expirationTime,n.child=e.child,n.memoizedProps=e.memoizedProps,n.memoizedState=e.memoizedState,n.updateQueue=e.updateQueue,t=e.dependencies,n.dependencies=t===null?null:{expirationTime:t.expirationTime,firstContext:t.firstContext,responders:t.responders},n.sibling=e.sibling,n.index=e.index,n.ref=e.ref,n}i(br,"Sg");function Il(e,t,n,r,s,d){var m=2;if(r=e,typeof e=="function")ha(e)&&(m=1);else if(typeof e=="string")m=5;else e:switch(e){case qt:return Bn(n.children,s,d,t);case $l:m=8,s|=7;break;case Wn:m=8,s|=1;break;case _r:return e=on(12,n,t,s|8),e.elementType=_r,e.type=_r,e.expirationTime=d,e;case Lr:return e=on(13,n,t,s),e.type=Lr,e.elementType=Lr,e.expirationTime=d,e;case di:return e=on(19,n,t,s),e.elementType=di,e.expirationTime=d,e;default:if(typeof e=="object"&&e!==null)switch(e.$$typeof){case ui:m=10;break e;case ci:m=9;break e;case ro:m=11;break e;case oo:m=14;break e;case Sr:m=16,r=null;break e;case zl:m=22;break e}throw Error(h(130,e==null?e:typeof e,""))}return t=on(m,n,t,s),t.elementType=e,t.type=r,t.expirationTime=d,t}i(Il,"Ug");function Bn(e,t,n,r){return e=on(7,e,r,t),e.expirationTime=n,e}i(Bn,"Wg");function va(e,t,n){return e=on(6,e,null,t),e.expirationTime=n,e}i(va,"Tg");function ga(e,t,n){return t=on(4,e.children!==null?e.children:[],e.key,t),t.expirationTime=n,t.stateNode={containerInfo:e.containerInfo,pendingChildren:null,implementation:e.implementation},t}i(ga,"Vg");function ec(e,t,n){this.tag=t,this.current=null,this.containerInfo=e,this.pingCache=this.pendingChildren=null,this.finishedExpirationTime=0,this.finishedWork=null,this.timeoutHandle=-1,this.pendingContext=this.context=null,this.hydrate=n,this.callbackNode=null,this.callbackPriority=90,this.lastExpiredTime=this.lastPingedTime=this.nextKnownPendingLevel=this.lastSuspendedTime=this.firstSuspendedTime=this.firstPendingTime=0}i(ec,"ak");function Su(e,t){var n=e.firstSuspendedTime;return e=e.lastSuspendedTime,n!==0&&n>=t&&e<=t}i(Su,"Aj");function kr(e,t){var n=e.firstSuspendedTime,r=e.lastSuspendedTime;n<t&&(e.firstSuspendedTime=t),(r>t||n===0)&&(e.lastSuspendedTime=t),t<=e.lastPingedTime&&(e.lastPingedTime=0),t<=e.lastExpiredTime&&(e.lastExpiredTime=0)}i(kr,"xi");function Tu(e,t){t>e.firstPendingTime&&(e.firstPendingTime=t);var n=e.firstSuspendedTime;n!==0&&(t>=n?e.firstSuspendedTime=e.lastSuspendedTime=e.nextKnownPendingLevel=0:t>=e.lastSuspendedTime&&(e.lastSuspendedTime=t+1),t>e.nextKnownPendingLevel&&(e.nextKnownPendingLevel=t))}i(Tu,"yi");function ya(e,t){var n=e.lastExpiredTime;(n===0||n>t)&&(e.lastExpiredTime=t)}i(ya,"Cj");function Hl(e,t,n,r){var s=t.current,d=rn(),m=Yo.suspense;d=Cr(d,s,m);e:if(n){n=n._reactInternalFiber;t:{if(sn(n)!==n||n.tag!==1)throw Error(h(170));var v=n;do{switch(v.tag){case 3:v=v.stateNode.context;break t;case 1:if(dt(v.type)){v=v.stateNode.__reactInternalMemoizedMergedChildContext;break t}}v=v.return}while(v!==null);throw Error(h(171))}if(n.tag===1){var L=n.type;if(dt(L)){n=Wr(n,L,v);break e}}n=v}else n=Yt;return t.context===null?t.context=n:t.pendingContext=n,t=Jt(d,m),t.payload={element:e},r=r===void 0?null:r,r!==null&&(t.callback=r),Hn(s,t),zn(s,d),d}i(Hl,"bk");function Ca(e){if(e=e.current,!e.child)return null;switch(e.child.tag){case 5:return e.child.stateNode;default:return e.child.stateNode}}i(Ca,"ck");function Mu(e,t){e=e.memoizedState,e!==null&&e.dehydrated!==null&&e.retryTime<t&&(e.retryTime=t)}i(Mu,"dk");function wa(e,t){Mu(e,t),(e=e.alternate)&&Mu(e,t)}i(wa,"ek");function xa(e,t,n){n=n!=null&&n.hydrate===!0;var r=new ec(e,t,n),s=on(3,null,null,t===2?7:t===1?3:0);r.current=s,s.stateNode=r,Lt(s),e[or]=r.current,n&&t!==0&&Jl(e,e.nodeType===9?e:e.ownerDocument),this._internalRoot=r}i(xa,"fk"),xa.prototype.render=function(e){Hl(e,this._internalRoot,null,null)},xa.prototype.unmount=function(){var e=this._internalRoot,t=e.containerInfo;Hl(null,e,null,function(){t[or]=null})};function li(e){return!(!e||e.nodeType!==1&&e.nodeType!==9&&e.nodeType!==11&&(e.nodeType!==8||e.nodeValue!==" react-mount-point-unstable "))}i(li,"gk");function tc(e,t){if(t||(t=e?e.nodeType===9?e.documentElement:e.firstChild:null,t=!(!t||t.nodeType!==1||!t.hasAttribute("data-reactroot"))),!t)for(var n;n=e.lastChild;)e.removeChild(n);return new xa(e,0,t?{hydrate:!0}:void 0)}i(tc,"hk");function Fl(e,t,n,r,s){var d=n._reactRootContainer;if(d){var m=d._internalRoot;if(typeof s=="function"){var v=s;s=i(function(){var S=Ca(m);v.call(S)},"e")}Hl(t,m,e,s)}else{if(d=n._reactRootContainer=tc(n,r),m=d._internalRoot,typeof s=="function"){var L=s;s=i(function(){var S=Ca(m);L.call(S)},"e")}Cu(function(){Hl(t,m,e,s)})}return Ca(m)}i(Fl,"ik");function nc(e,t,n){var r=3<arguments.length&&arguments[3]!==void 0?arguments[3]:null;return{$$typeof:Un,key:r==null?null:""+r,children:e,containerInfo:t,implementation:n}}i(nc,"jk"),fo=i(function(e){if(e.tag===13){var t=Ue(rn(),150,100);zn(e,t),wa(e,t)}},"wc"),Xn=i(function(e){e.tag===13&&(zn(e,3),wa(e,3))},"xc"),Oi=i(function(e){if(e.tag===13){var t=rn();t=Cr(t,e,null),zn(e,t),wa(e,t)}},"yc"),he=i(function(e,t,n){switch(t){case"input":if(vi(e,n),t=n.name,n.type==="radio"&&t!=null){for(n=e;n.parentNode;)n=n.parentNode;for(n=n.querySelectorAll("input[name="+JSON.stringify(""+t)+'][type="radio"]'),t=0;t<n.length;t++){var r=n[t];if(r!==e&&r.form===e.form){var s=Ao(r);if(!s)throw Error(h(90));pi(r),vi(r,s)}}}break;case"textarea":xi(e,n);break;case"select":t=n.value,t!=null&&Zn(e,!!n.multiple,t,!1)}},"za"),Qe=yu,at=i(function(e,t,n,r,s){var d=_e;_e|=4;try{return ce(98,e.bind(null,t,n,r,s))}finally{_e=d,_e===pt&&pe()}},"Ga"),wt=i(function(){(_e&(1|Wt|nn))===pt&&(ju(),eo())},"Ha"),be=i(function(e,t){var n=_e;_e|=2;try{return e(t)}finally{_e=n,_e===pt&&pe()}},"Ia");function Nu(e,t){var n=2<arguments.length&&arguments[2]!==void 0?arguments[2]:null;if(!li(t))throw Error(h(200));return nc(e,t,null,n)}i(Nu,"kk");var rc={Events:[ir,pn,Ao,X,O,Tn,function(e){Ni(e,ss)},ze,oe,mn,Nr,eo,{current:!1}]};(function(e){var t=e.findFiberByHostInstance;return Gu(T({},e,{overrideHookState:null,overrideProps:null,setSuspenseHandler:null,scheduleUpdate:null,currentDispatcherRef:_t.ReactCurrentDispatcher,findHostInstanceByFiber:i(function(n){return n=Ql(n),n===null?null:n.stateNode},"findHostInstanceByFiber"),findFiberByHostInstance:i(function(n){return t?t(n):null},"findFiberByHostInstance"),findHostInstancesForRefresh:null,scheduleRefresh:null,scheduleRoot:null,setRefreshHandler:null,getCurrentFiber:null}))})({findFiberByHostInstance:Qt,bundleType:0,version:"16.14.0",rendererPackageName:"react-dom"}),Y=rc,Y=Nu,Y=i(function(e){if(e==null)return null;if(e.nodeType===1)return e;var t=e._reactInternalFiber;if(t===void 0)throw typeof e.render=="function"?Error(h(188)):Error(h(268,Object.keys(e)));return e=Ql(t),e=e===null?null:e.stateNode,e},"__webpack_unused_export__"),Y=i(function(e,t){if((_e&(Wt|nn))!==pt)throw Error(h(187));var n=_e;_e|=1;try{return ce(99,e.bind(null,t))}finally{_e=n,pe()}},"__webpack_unused_export__"),Y=i(function(e,t,n){if(!li(t))throw Error(h(200));return Fl(null,e,t,!0,n)},"__webpack_unused_export__"),_.render=function(e,t,n){if(!li(t))throw Error(h(200));return Fl(null,e,t,!1,n)},Y=i(function(e){if(!li(e))throw Error(h(40));return e._reactRootContainer?(Cu(function(){Fl(null,null,e,!1,function(){e._reactRootContainer=null,e[or]=null})}),!0):!1},"__webpack_unused_export__"),Y=yu,Y=i(function(e,t){return Nu(e,t,2<arguments.length&&arguments[2]!==void 0?arguments[2]:null)},"__webpack_unused_export__"),Y=i(function(e,t,n,r){if(!li(n))throw Error(h(200));if(e==null||e._reactInternalFiber===void 0)throw Error(h(38));return Fl(e,t,n,!1,r)},"__webpack_unused_export__"),Y="16.14.0"},40961:(k,_,U)=>{"use strict";function Y(){if(!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__=="undefined"||typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE!="function"))try{__REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(Y)}catch(V){console.error(V)}}i(Y,"checkDCE"),Y(),k.exports=U(22551)},15287:(k,_,U)=>{"use strict";/** @license React v16.14.0
 * react.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var Y=U(45228),V=typeof Symbol=="function"&&Symbol.for,T=V?Symbol.for("react.element"):60103,g=V?Symbol.for("react.portal"):60106,h=V?Symbol.for("react.fragment"):60107,D=V?Symbol.for("react.strict_mode"):60108,I=V?Symbol.for("react.profiler"):60114,$=V?Symbol.for("react.provider"):60109,F=V?Symbol.for("react.context"):60110,J=V?Symbol.for("react.forward_ref"):60112,G=V?Symbol.for("react.suspense"):60113,De=V?Symbol.for("react.memo"):60115,Ve=V?Symbol.for("react.lazy"):60116,me=typeof Symbol=="function"&&Symbol.iterator;function Ae(w){for(var P="https://reactjs.org/docs/error-decoder.html?invariant="+w,ge=1;ge<arguments.length;ge++)P+="&args[]="+encodeURIComponent(arguments[ge]);return"Minified React error #"+w+"; visit "+P+" for the full message or use the non-minified dev environment for full errors and additional helpful warnings."}i(Ae,"C");var nt={isMounted:i(function(){return!1},"isMounted"),enqueueForceUpdate:i(function(){},"enqueueForceUpdate"),enqueueReplaceState:i(function(){},"enqueueReplaceState"),enqueueSetState:i(function(){},"enqueueSetState")},W={};function N(w,P,ge){this.props=w,this.context=P,this.refs=W,this.updater=ge||nt}i(N,"F"),N.prototype.isReactComponent={},N.prototype.setState=function(w,P){if(typeof w!="object"&&typeof w!="function"&&w!=null)throw Error(Ae(85));this.updater.enqueueSetState(this,w,P,"setState")},N.prototype.forceUpdate=function(w){this.updater.enqueueForceUpdate(this,w,"forceUpdate")};function l(){}i(l,"G"),l.prototype=N.prototype;function ie(w,P,ge){this.props=w,this.context=P,this.refs=W,this.updater=ge||nt}i(ie,"H");var Q=ie.prototype=new l;Q.constructor=ie,Y(Q,N.prototype),Q.isPureReactComponent=!0;var Z={current:null},O=Object.prototype.hasOwnProperty,H={key:!0,ref:!0,__self:!0,__source:!0};function re(w,P,ge){var Le,ke={},Be=null,bt=null;if(P!=null)for(Le in P.ref!==void 0&&(bt=P.ref),P.key!==void 0&&(Be=""+P.key),P)O.call(P,Le)&&!H.hasOwnProperty(Le)&&(ke[Le]=P[Le]);var Me=arguments.length-2;if(Me===1)ke.children=ge;else if(1<Me){for(var we=Array(Me),Pe=0;Pe<Me;Pe++)we[Pe]=arguments[Pe+2];ke.children=we}if(w&&w.defaultProps)for(Le in Me=w.defaultProps,Me)ke[Le]===void 0&&(ke[Le]=Me[Le]);return{$$typeof:T,type:w,key:Be,ref:bt,props:ke,_owner:Z.current}}i(re,"M");function X(w,P){return{$$typeof:T,type:w.type,key:P,ref:w.ref,props:w.props,_owner:w._owner}}i(X,"N");function ue(w){return typeof w=="object"&&w!==null&&w.$$typeof===T}i(ue,"O");function he(w){var P={"=":"=0",":":"=2"};return"$"+(""+w).replace(/[=:]/g,function(ge){return P[ge]})}i(he,"escape");var ve=/\/+/g,Ce=[];function He(w,P,ge,Le){if(Ce.length){var ke=Ce.pop();return ke.result=w,ke.keyPrefix=P,ke.func=ge,ke.context=Le,ke.count=0,ke}return{result:w,keyPrefix:P,func:ge,context:Le,count:0}}i(He,"R");function ze(w){w.result=null,w.keyPrefix=null,w.func=null,w.context=null,w.count=0,10>Ce.length&&Ce.push(w)}i(ze,"S");function oe(w,P,ge,Le){var ke=typeof w;(ke==="undefined"||ke==="boolean")&&(w=null);var Be=!1;if(w===null)Be=!0;else switch(ke){case"string":case"number":Be=!0;break;case"object":switch(w.$$typeof){case T:case g:Be=!0}}if(Be)return ge(Le,w,P===""?"."+at(w,0):P),1;if(Be=0,P=P===""?".":P+":",Array.isArray(w))for(var bt=0;bt<w.length;bt++){ke=w[bt];var Me=P+at(ke,bt);Be+=oe(ke,Me,ge,Le)}else if(w===null||typeof w!="object"?Me=null:(Me=me&&w[me]||w["@@iterator"],Me=typeof Me=="function"?Me:null),typeof Me=="function")for(w=Me.call(w),bt=0;!(ke=w.next()).done;)ke=ke.value,Me=P+at(ke,bt++),Be+=oe(ke,Me,ge,Le);else if(ke==="object")throw ge=""+w,Error(Ae(31,ge==="[object Object]"?"object with keys {"+Object.keys(w).join(", ")+"}":ge,""));return Be}i(oe,"T");function Qe(w,P,ge){return w==null?0:oe(w,"",P,ge)}i(Qe,"V");function at(w,P){return typeof w=="object"&&w!==null&&w.key!=null?he(w.key):P.toString(36)}i(at,"U");function wt(w,P){w.func.call(w.context,P,w.count++)}i(wt,"W");function be(w,P,ge){var Le=w.result,ke=w.keyPrefix;w=w.func.call(w.context,P,w.count++),Array.isArray(w)?qe(w,Le,ge,function(Be){return Be}):w!=null&&(ue(w)&&(w=X(w,ke+(!w.key||P&&P.key===w.key?"":(""+w.key).replace(ve,"$&/")+"/")+ge)),Le.push(w))}i(be,"aa");function qe(w,P,ge,Le,ke){var Be="";ge!=null&&(Be=(""+ge).replace(ve,"$&/")+"/"),P=He(P,Be,Le,ke),Qe(w,be,P),ze(P)}i(qe,"X");var B={current:null};function K(){var w=B.current;if(w===null)throw Error(Ae(321));return w}i(K,"Z");var de={ReactCurrentDispatcher:B,ReactCurrentBatchConfig:{suspense:null},ReactCurrentOwner:Z,IsSomeRendererActing:{current:!1},assign:Y};_.Children={map:i(function(w,P,ge){if(w==null)return w;var Le=[];return qe(w,Le,null,P,ge),Le},"map"),forEach:i(function(w,P,ge){if(w==null)return w;P=He(null,null,P,ge),Qe(w,wt,P),ze(P)},"forEach"),count:i(function(w){return Qe(w,function(){return null},null)},"count"),toArray:i(function(w){var P=[];return qe(w,P,null,function(ge){return ge}),P},"toArray"),only:i(function(w){if(!ue(w))throw Error(Ae(143));return w},"only")},_.Component=N,_.Fragment=h,_.Profiler=I,_.PureComponent=ie,_.StrictMode=D,_.Suspense=G,_.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED=de,_.cloneElement=function(w,P,ge){if(w==null)throw Error(Ae(267,w));var Le=Y({},w.props),ke=w.key,Be=w.ref,bt=w._owner;if(P!=null){if(P.ref!==void 0&&(Be=P.ref,bt=Z.current),P.key!==void 0&&(ke=""+P.key),w.type&&w.type.defaultProps)var Me=w.type.defaultProps;for(we in P)O.call(P,we)&&!H.hasOwnProperty(we)&&(Le[we]=P[we]===void 0&&Me!==void 0?Me[we]:P[we])}var we=arguments.length-2;if(we===1)Le.children=ge;else if(1<we){Me=Array(we);for(var Pe=0;Pe<we;Pe++)Me[Pe]=arguments[Pe+2];Le.children=Me}return{$$typeof:T,type:w.type,key:ke,ref:Be,props:Le,_owner:bt}},_.createContext=function(w,P){return P===void 0&&(P=null),w={$$typeof:F,_calculateChangedBits:P,_currentValue:w,_currentValue2:w,_threadCount:0,Provider:null,Consumer:null},w.Provider={$$typeof:$,_context:w},w.Consumer=w},_.createElement=re,_.createFactory=function(w){var P=re.bind(null,w);return P.type=w,P},_.createRef=function(){return{current:null}},_.forwardRef=function(w){return{$$typeof:J,render:w}},_.isValidElement=ue,_.lazy=function(w){return{$$typeof:Ve,_ctor:w,_status:-1,_result:null}},_.memo=function(w,P){return{$$typeof:De,type:w,compare:P===void 0?null:P}},_.useCallback=function(w,P){return K().useCallback(w,P)},_.useContext=function(w,P){return K().useContext(w,P)},_.useDebugValue=function(){},_.useEffect=function(w,P){return K().useEffect(w,P)},_.useImperativeHandle=function(w,P,ge){return K().useImperativeHandle(w,P,ge)},_.useLayoutEffect=function(w,P){return K().useLayoutEffect(w,P)},_.useMemo=function(w,P){return K().useMemo(w,P)},_.useReducer=function(w,P,ge){return K().useReducer(w,P,ge)},_.useRef=function(w){return K().useRef(w)},_.useState=function(w){return K().useState(w)},_.version="16.14.0"},96540:(k,_,U)=>{"use strict";k.exports=U(15287)},7463:(k,_)=>{"use strict";/** @license React v0.19.1
 * scheduler.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var U,Y,V,T,g;if(typeof window=="undefined"||typeof MessageChannel!="function"){var h=null,D=null,I=i(function(){if(h!==null)try{var B=_.unstable_now();h(!0,B),h=null}catch(K){throw setTimeout(I,0),K}},"t"),$=Date.now();_.unstable_now=function(){return Date.now()-$},U=i(function(B){h!==null?setTimeout(U,0,B):(h=B,setTimeout(I,0))},"f"),Y=i(function(B,K){D=setTimeout(B,K)},"g"),V=i(function(){clearTimeout(D)},"h"),T=i(function(){return!1},"k"),g=_.unstable_forceFrameRate=function(){}}else{var F=window.performance,J=window.Date,G=window.setTimeout,De=window.clearTimeout;if(typeof console!="undefined"){var Ve=window.cancelAnimationFrame;typeof window.requestAnimationFrame!="function"&&console.error("This browser doesn't support requestAnimationFrame. Make sure that you load a polyfill in older browsers. https://fb.me/react-polyfills"),typeof Ve!="function"&&console.error("This browser doesn't support cancelAnimationFrame. Make sure that you load a polyfill in older browsers. https://fb.me/react-polyfills")}if(typeof F=="object"&&typeof F.now=="function")_.unstable_now=function(){return F.now()};else{var me=J.now();_.unstable_now=function(){return J.now()-me}}var Ae=!1,nt=null,W=-1,N=5,l=0;T=i(function(){return _.unstable_now()>=l},"k"),g=i(function(){},"l"),_.unstable_forceFrameRate=function(B){0>B||125<B?console.error("forceFrameRate takes a positive int between 0 and 125, forcing framerates higher than 125 fps is not unsupported"):N=0<B?Math.floor(1e3/B):5};var ie=new MessageChannel,Q=ie.port2;ie.port1.onmessage=function(){if(nt!==null){var B=_.unstable_now();l=B+N;try{nt(!0,B)?Q.postMessage(null):(Ae=!1,nt=null)}catch(K){throw Q.postMessage(null),K}}else Ae=!1},U=i(function(B){nt=B,Ae||(Ae=!0,Q.postMessage(null))},"f"),Y=i(function(B,K){W=G(function(){B(_.unstable_now())},K)},"g"),V=i(function(){De(W),W=-1},"h")}function Z(B,K){var de=B.length;B.push(K);e:for(;;){var w=de-1>>>1,P=B[w];if(P!==void 0&&0<re(P,K))B[w]=K,B[de]=P,de=w;else break e}}i(Z,"J");function O(B){return B=B[0],B===void 0?null:B}i(O,"L");function H(B){var K=B[0];if(K!==void 0){var de=B.pop();if(de!==K){B[0]=de;e:for(var w=0,P=B.length;w<P;){var ge=2*(w+1)-1,Le=B[ge],ke=ge+1,Be=B[ke];if(Le!==void 0&&0>re(Le,de))Be!==void 0&&0>re(Be,Le)?(B[w]=Be,B[ke]=de,w=ke):(B[w]=Le,B[ge]=de,w=ge);else if(Be!==void 0&&0>re(Be,de))B[w]=Be,B[ke]=de,w=ke;else break e}}return K}return null}i(H,"M");function re(B,K){var de=B.sortIndex-K.sortIndex;return de!==0?de:B.id-K.id}i(re,"K");var X=[],ue=[],he=1,ve=null,Ce=3,He=!1,ze=!1,oe=!1;function Qe(B){for(var K=O(ue);K!==null;){if(K.callback===null)H(ue);else if(K.startTime<=B)H(ue),K.sortIndex=K.expirationTime,Z(X,K);else break;K=O(ue)}}i(Qe,"V");function at(B){if(oe=!1,Qe(B),!ze)if(O(X)!==null)ze=!0,U(wt);else{var K=O(ue);K!==null&&Y(at,K.startTime-B)}}i(at,"W");function wt(B,K){ze=!1,oe&&(oe=!1,V()),He=!0;var de=Ce;try{for(Qe(K),ve=O(X);ve!==null&&(!(ve.expirationTime>K)||B&&!T());){var w=ve.callback;if(w!==null){ve.callback=null,Ce=ve.priorityLevel;var P=w(ve.expirationTime<=K);K=_.unstable_now(),typeof P=="function"?ve.callback=P:ve===O(X)&&H(X),Qe(K)}else H(X);ve=O(X)}if(ve!==null)var ge=!0;else{var Le=O(ue);Le!==null&&Y(at,Le.startTime-K),ge=!1}return ge}finally{ve=null,Ce=de,He=!1}}i(wt,"X");function be(B){switch(B){case 1:return-1;case 2:return 250;case 5:return 1073741823;case 4:return 1e4;default:return 5e3}}i(be,"Y");var qe=g;_.unstable_IdlePriority=5,_.unstable_ImmediatePriority=1,_.unstable_LowPriority=4,_.unstable_NormalPriority=3,_.unstable_Profiling=null,_.unstable_UserBlockingPriority=2,_.unstable_cancelCallback=function(B){B.callback=null},_.unstable_continueExecution=function(){ze||He||(ze=!0,U(wt))},_.unstable_getCurrentPriorityLevel=function(){return Ce},_.unstable_getFirstCallbackNode=function(){return O(X)},_.unstable_next=function(B){switch(Ce){case 1:case 2:case 3:var K=3;break;default:K=Ce}var de=Ce;Ce=K;try{return B()}finally{Ce=de}},_.unstable_pauseExecution=function(){},_.unstable_requestPaint=qe,_.unstable_runWithPriority=function(B,K){switch(B){case 1:case 2:case 3:case 4:case 5:break;default:B=3}var de=Ce;Ce=B;try{return K()}finally{Ce=de}},_.unstable_scheduleCallback=function(B,K,de){var w=_.unstable_now();if(typeof de=="object"&&de!==null){var P=de.delay;P=typeof P=="number"&&0<P?w+P:w,de=typeof de.timeout=="number"?de.timeout:be(B)}else de=be(B),P=w;return de=P+de,B={id:he++,callback:K,priorityLevel:B,startTime:P,expirationTime:de,sortIndex:-1},P>w?(B.sortIndex=P,Z(ue,B),O(X)===null&&B===O(ue)&&(oe?V():oe=!0,Y(at,P-w))):(B.sortIndex=de,Z(X,B),ze||He||(ze=!0,U(wt))),B},_.unstable_shouldYield=function(){var B=_.unstable_now();Qe(B);var K=O(X);return K!==ve&&ve!==null&&K!==null&&K.callback!==null&&K.startTime<=B&&K.expirationTime<ve.expirationTime||T()},_.unstable_wrapCallback=function(B){var K=Ce;return function(){var de=Ce;Ce=K;try{return B.apply(this,arguments)}finally{Ce=de}}}},69982:(k,_,U)=>{"use strict";k.exports=U(7463)},85072:k=>{"use strict";var _=[];function U(T){for(var g=-1,h=0;h<_.length;h++)if(_[h].identifier===T){g=h;break}return g}i(U,"getIndexByIdentifier");function Y(T,g){for(var h={},D=[],I=0;I<T.length;I++){var $=T[I],F=g.base?$[0]+g.base:$[0],J=h[F]||0,G="".concat(F," ").concat(J);h[F]=J+1;var De=U(G),Ve={css:$[1],media:$[2],sourceMap:$[3],supports:$[4],layer:$[5]};if(De!==-1)_[De].references++,_[De].updater(Ve);else{var me=V(Ve,g);g.byIndex=I,_.splice(I,0,{identifier:G,updater:me,references:1})}D.push(G)}return D}i(Y,"modulesToDom");function V(T,g){var h=g.domAPI(g);h.update(T);var D=i(function($){if($){if($.css===T.css&&$.media===T.media&&$.sourceMap===T.sourceMap&&$.supports===T.supports&&$.layer===T.layer)return;h.update(T=$)}else h.remove()},"updater");return D}i(V,"addElementStyle"),k.exports=function(T,g){g=g||{},T=T||[];var h=Y(T,g);return i(function(I){I=I||[];for(var $=0;$<h.length;$++){var F=h[$],J=U(F);_[J].references--}for(var G=Y(I,g),De=0;De<h.length;De++){var Ve=h[De],me=U(Ve);_[me].references===0&&(_[me].updater(),_.splice(me,1))}h=G},"update")}},77659:k=>{"use strict";var _={};function U(V){if(typeof _[V]=="undefined"){var T=document.querySelector(V);if(window.HTMLIFrameElement&&T instanceof window.HTMLIFrameElement)try{T=T.contentDocument.head}catch{T=null}_[V]=T}return _[V]}i(U,"getTarget");function Y(V,T){var g=U(V);if(!g)throw new Error("Couldn't find a style target. This probably means that the value for the 'insert' parameter is invalid.");g.appendChild(T)}i(Y,"insertBySelector"),k.exports=Y},10540:k=>{"use strict";function _(U){var Y=document.createElement("style");return U.setAttributes(Y,U.attributes),U.insert(Y,U.options),Y}i(_,"insertStyleElement"),k.exports=_},55056:(k,_,U)=>{"use strict";function Y(V){var T=U.nc;T&&V.setAttribute("nonce",T)}i(Y,"setAttributesWithoutAttributes"),k.exports=Y},97825:k=>{"use strict";function _(V,T,g){var h="";g.supports&&(h+="@supports (".concat(g.supports,") {")),g.media&&(h+="@media ".concat(g.media," {"));var D=typeof g.layer!="undefined";D&&(h+="@layer".concat(g.layer.length>0?" ".concat(g.layer):""," {")),h+=g.css,D&&(h+="}"),g.media&&(h+="}"),g.supports&&(h+="}");var I=g.sourceMap;I&&typeof btoa!="undefined"&&(h+=`
/*# sourceMappingURL=data:application/json;base64,`.concat(btoa(unescape(encodeURIComponent(JSON.stringify(I))))," */")),T.styleTagTransform(h,V,T.options)}i(_,"apply");function U(V){if(V.parentNode===null)return!1;V.parentNode.removeChild(V)}i(U,"removeStyleElement");function Y(V){if(typeof document=="undefined")return{update:i(function(){},"update"),remove:i(function(){},"remove")};var T=V.insertStyleElement(V);return{update:i(function(h){_(T,V,h)},"update"),remove:i(function(){U(T)},"remove")}}i(Y,"domAPI"),k.exports=Y},41113:k=>{"use strict";function _(U,Y){if(Y.styleSheet)Y.styleSheet.cssText=U;else{for(;Y.firstChild;)Y.removeChild(Y.firstChild);Y.appendChild(document.createTextNode(U))}}i(_,"styleTagTransform"),k.exports=_},61440:k=>{k.exports='<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M14.12 13.9725L15 12.5L9.37924 2H7.61921L1.99847 12.5L2.87849 13.9725H14.12ZM2.87849 12.9725L8.49922 2.47249L14.12 12.9725H2.87849ZM7.98949 6H8.98799V10H7.98949V6ZM7.98949 11H8.98799V12H7.98949V11Z" fill="#C5C5C5"></path></svg>'},34439:k=>{k.exports='<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#clip0_818_123307)"><path d="M16 7.99201C16 3.58042 12.416 0 8 0C3.584 0 0 3.58042 0 7.99201C0 10.4216 1.104 12.6114 2.832 14.0819C2.848 14.0979 2.864 14.0979 2.864 14.1139C3.008 14.2258 3.152 14.3377 3.312 14.4496C3.392 14.4975 3.456 14.5614 3.536 14.6254C4.816 15.4885 6.352 16 8.016 16C9.68 16 11.216 15.4885 12.496 14.6254C12.576 14.5774 12.64 14.5135 12.72 14.4655C12.864 14.3536 13.024 14.2418 13.168 14.1299C13.184 14.1139 13.2 14.1139 13.2 14.0979C14.896 12.6114 16 10.4216 16 7.99201ZM8 14.993C6.496 14.993 5.12 14.5135 3.984 13.7143C4 13.5864 4.032 13.4585 4.064 13.3307C4.16 12.979 4.304 12.6434 4.48 12.3397C4.656 12.036 4.864 11.7642 5.12 11.5245C5.36 11.2847 5.648 11.0609 5.936 10.8851C6.24 10.7093 6.56 10.5814 6.912 10.4855C7.264 10.3896 7.632 10.3417 8 10.3417C8.592 10.3417 9.136 10.4535 9.632 10.6613C10.128 10.8691 10.56 11.1568 10.928 11.5085C11.296 11.8761 11.584 12.3077 11.792 12.8032C11.904 13.0909 11.984 13.3946 12.032 13.7143C10.88 14.5135 9.504 14.993 8 14.993ZM5.552 7.59241C5.408 7.27273 5.344 6.92108 5.344 6.56943C5.344 6.21778 5.408 5.86613 5.552 5.54645C5.696 5.22677 5.888 4.93906 6.128 4.6993C6.368 4.45954 6.656 4.26773 6.976 4.12388C7.296 3.98002 7.648 3.91608 8 3.91608C8.368 3.91608 8.704 3.98002 9.024 4.12388C9.344 4.26773 9.632 4.45954 9.872 4.6993C10.112 4.93906 10.304 5.22677 10.448 5.54645C10.592 5.86613 10.656 6.21778 10.656 6.56943C10.656 6.93706 10.592 7.27273 10.448 7.59241C10.304 7.91209 10.112 8.1998 9.872 8.43956C9.632 8.67932 9.344 8.87113 9.024 9.01499C8.384 9.28671 7.6 9.28671 6.96 9.01499C6.64 8.87113 6.352 8.67932 6.112 8.43956C5.872 8.1998 5.68 7.91209 5.552 7.59241ZM12.976 12.8991C12.976 12.8671 12.96 12.8511 12.96 12.8192C12.8 12.3237 12.576 11.8442 12.272 11.4126C11.968 10.981 11.616 10.5974 11.184 10.2777C10.864 10.038 10.512 9.83017 10.144 9.67033C10.32 9.55844 10.48 9.41459 10.608 9.28671C10.848 9.04695 11.056 8.79121 11.232 8.5035C11.408 8.21578 11.536 7.91209 11.632 7.57642C11.728 7.24076 11.76 6.90509 11.76 6.56943C11.76 6.04196 11.664 5.54645 11.472 5.0989C11.28 4.65135 11.008 4.25175 10.656 3.9001C10.32 3.56444 9.904 3.29271 9.456 3.1009C9.008 2.90909 8.512 2.81319 7.984 2.81319C7.456 2.81319 6.96 2.90909 6.512 3.1009C6.064 3.29271 5.648 3.56444 5.312 3.91608C4.976 4.25175 4.704 4.66733 4.512 5.11489C4.32 5.56244 4.224 6.05794 4.224 6.58541C4.224 6.93706 4.272 7.27273 4.368 7.59241C4.464 7.92807 4.592 8.23177 4.768 8.51948C4.928 8.80719 5.152 9.06294 5.392 9.3027C5.536 9.44655 5.696 9.57443 5.872 9.68631C5.488 9.86214 5.136 10.0699 4.832 10.3097C4.416 10.6294 4.048 11.013 3.744 11.4286C3.44 11.8601 3.216 12.3237 3.056 12.8352C3.04 12.8671 3.04 12.8991 3.04 12.9151C1.776 11.6364 0.992 9.91009 0.992 7.99201C0.992 4.13986 4.144 0.991009 8 0.991009C11.856 0.991009 15.008 4.13986 15.008 7.99201C15.008 9.91009 14.224 11.6364 12.976 12.8991Z" fill="#C5C5C5"></path></g><defs><clipPath id="clip0_818_123307"><rect width="16" height="16" fill="white"></rect></clipPath></defs></svg>'},34894:k=>{k.exports='<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z" fill="#C5C5C5"></path></svg>'},30407:k=>{k.exports='<svg viewBox="0 -2 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M7.97612 10.0719L12.3334 5.7146L12.9521 6.33332L8.28548 11L7.66676 11L3.0001 6.33332L3.61882 5.7146L7.97612 10.0719Z" fill="#C5C5C5"></path></svg>'},10650:k=>{k.exports='<svg viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M7.97612 10.0719L12.3334 5.7146L12.9521 6.33332L8.28548 11L7.66676 11L3.0001 6.33332L3.61882 5.7146L7.97612 10.0719Z"></path></svg>'},85130:k=>{k.exports='<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M7.99998 8.70711L11.6464 12.3536L12.3535 11.6464L8.70708 8L12.3535 4.35355L11.6464 3.64645L7.99998 7.29289L4.35353 3.64645L3.64642 4.35355L7.29287 8L3.64642 11.6464L4.35353 12.3536L7.99998 8.70711Z" fill="#C5C5C5"></path></svg>'},2301:k=>{k.exports='<svg viewBox="0 0 16 16" version="1.1" aria-hidden="true"><path fill-rule="evenodd" d="M14 1H2c-.55 0-1 .45-1 1v8c0 .55.45 1 1 1h2v3.5L7.5 11H14c.55 0 1-.45 1-1V2c0-.55-.45-1-1-1zm0 9H7l-2 2v-2H2V2h12v8z"></path></svg>'},5771:k=>{k.exports='<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7.52 0H8.48V4.05333C9.47556 4.16 10.3111 4.58667 10.9867 5.33333C11.6622 6.08 12 6.96889 12 8C12 9.03111 11.6622 9.92 10.9867 10.6667C10.3111 11.4133 9.47556 11.84 8.48 11.9467V16H7.52V11.9467C6.52444 11.84 5.68889 11.4133 5.01333 10.6667C4.33778 9.92 4 9.03111 4 8C4 6.96889 4.33778 6.08 5.01333 5.33333C5.68889 4.58667 6.52444 4.16 7.52 4.05333V0ZM8 10.6133C8.71111 10.6133 9.31556 10.3644 9.81333 9.86667C10.3467 9.33333 10.6133 8.71111 10.6133 8C10.6133 7.28889 10.3467 6.68444 9.81333 6.18667C9.31556 5.65333 8.71111 5.38667 8 5.38667C7.28889 5.38667 6.66667 5.65333 6.13333 6.18667C5.63556 6.68444 5.38667 7.28889 5.38667 8C5.38667 8.71111 5.63556 9.33333 6.13333 9.86667C6.66667 10.3644 7.28889 10.6133 8 10.6133Z" fill="#A0A0A0"></path></svg>'},94339:k=>{k.exports='<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M13.807 2.265C13.228 1.532 12.313 1.141 11.083 1.004C9.877 0.870002 8.821 1.038 8.139 1.769C8.09 1.822 8.043 1.877 8 1.933C7.957 1.877 7.91 1.822 7.861 1.769C7.179 1.038 6.123 0.870002 4.917 1.004C3.687 1.141 2.772 1.532 2.193 2.265C1.628 2.981 1.5 3.879 1.5 4.75C1.5 5.322 1.553 5.897 1.754 6.405L1.586 7.243L1.52 7.276C0.588 7.742 0 8.694 0 9.736V11C0 11.24 0.086 11.438 0.156 11.567C0.231 11.704 0.325 11.828 0.415 11.933C0.595 12.143 0.819 12.346 1.02 12.513C1.225 12.684 1.427 12.836 1.577 12.943C1.816 13.116 2.062 13.275 2.318 13.423C2.625 13.6 3.066 13.832 3.614 14.065C4.391 14.395 5.404 14.722 6.553 14.887C6.203 14.377 5.931 13.809 5.751 13.202C5.173 13.055 4.645 12.873 4.201 12.684C3.717 12.479 3.331 12.274 3.067 12.123L3.002 12.085V7.824L3.025 7.709C3.515 7.919 4.1 8 4.752 8C5.898 8 6.812 7.672 7.462 7.009C7.681 6.785 7.859 6.535 8.002 6.266C8.049 6.354 8.106 6.436 8.16 6.52C8.579 6.238 9.038 6.013 9.522 5.843C9.26 5.52 9.077 5.057 8.996 4.407C8.879 3.471 9.034 3.011 9.238 2.793C9.431 2.586 9.875 2.379 10.919 2.495C11.939 2.608 12.398 2.899 12.632 3.195C12.879 3.508 13.002 3.984 13.002 4.75C13.002 5.158 12.967 5.453 12.909 5.674C13.398 5.792 13.865 5.967 14.3 6.197C14.443 5.741 14.502 5.248 14.502 4.75C14.502 3.879 14.374 2.981 13.809 2.265H13.807ZM7.006 4.407C6.915 5.133 6.704 5.637 6.388 5.959C6.089 6.264 5.604 6.5 4.75 6.5C3.828 6.5 3.47 6.301 3.308 6.12C3.129 5.92 3 5.542 3 4.75C3 3.984 3.123 3.508 3.37 3.195C3.604 2.899 4.063 2.609 5.083 2.495C6.127 2.379 6.571 2.586 6.764 2.793C6.968 3.011 7.123 3.471 7.006 4.407Z" fill="currentColor"></path><path d="M11.5 7C9.015 7 7 9.015 7 11.5C7 13.985 9.015 16 11.5 16C13.985 16 16 13.985 16 11.5C16 9.015 13.985 7 11.5 7ZM13.854 13.146L13.147 13.853L11.501 12.207L9.855 13.853L9.148 13.146L10.794 11.5L9.148 9.854L9.855 9.147L11.501 10.793L13.147 9.147L13.854 9.854L12.208 11.5L13.854 13.146Z" fill="var(--vscode-list-errorForeground, currentColor)"></path></svg>'},58726:k=>{k.exports='<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M13.807 2.265C13.228 1.532 12.313 1.141 11.083 1.004C9.877 0.870002 8.821 1.038 8.139 1.769C8.09 1.822 8.043 1.877 8 1.933C7.957 1.877 7.91 1.822 7.861 1.769C7.179 1.038 6.123 0.870002 4.917 1.004C3.687 1.141 2.772 1.532 2.193 2.265C1.628 2.981 1.5 3.879 1.5 4.75C1.5 5.322 1.553 5.897 1.754 6.405L1.586 7.243L1.52 7.276C0.588 7.742 0 8.694 0 9.736V11C0 11.24 0.086 11.438 0.156 11.567C0.231 11.704 0.325 11.828 0.415 11.933C0.595 12.143 0.819 12.346 1.02 12.513C1.225 12.684 1.427 12.836 1.577 12.943C1.816 13.116 2.062 13.275 2.318 13.423C2.625 13.6 3.066 13.832 3.614 14.065C4.391 14.395 5.404 14.722 6.553 14.887C6.203 14.377 5.931 13.809 5.751 13.202C5.173 13.055 4.645 12.873 4.201 12.684C3.717 12.479 3.331 12.274 3.067 12.123L3.002 12.085V7.824L3.025 7.709C3.515 7.919 4.1 8 4.752 8C5.898 8 6.812 7.672 7.462 7.009C7.681 6.785 7.859 6.535 8.002 6.266C8.049 6.354 8.106 6.436 8.16 6.52C8.579 6.238 9.038 6.013 9.522 5.843C9.26 5.52 9.077 5.057 8.996 4.407C8.879 3.471 9.034 3.011 9.238 2.793C9.431 2.586 9.875 2.379 10.919 2.495C11.939 2.608 12.398 2.899 12.632 3.195C12.879 3.508 13.002 3.984 13.002 4.75C13.002 5.158 12.967 5.453 12.909 5.674C13.398 5.792 13.865 5.967 14.3 6.197C14.443 5.741 14.502 5.248 14.502 4.75C14.502 3.879 14.374 2.981 13.809 2.265H13.807ZM7.006 4.407C6.915 5.133 6.704 5.637 6.388 5.959C6.089 6.264 5.604 6.5 4.75 6.5C3.828 6.5 3.47 6.301 3.308 6.12C3.129 5.92 3 5.542 3 4.75C3 3.984 3.123 3.508 3.37 3.195C3.604 2.899 4.063 2.609 5.083 2.495C6.127 2.379 6.571 2.586 6.764 2.793C6.968 3.011 7.123 3.471 7.006 4.407Z" fill="currentColor"></path><path d="M11.5 7C9.015 7 7 9.015 7 11.5C7 13.985 9.015 16 11.5 16C13.985 16 16 13.985 16 11.5C16 9.015 13.985 7 11.5 7ZM11.5 14.25C10.963 14.25 10.445 14.105 10 13.844V14.5H9V12.5L9.5 12H11.5V13H10.536C10.823 13.16 11.155 13.25 11.5 13.25C12.177 13.25 12.805 12.907 13.137 12.354L13.994 12.87C13.481 13.722 12.525 14.25 11.5 14.25ZM14 10.5L13.5 11H11.5V10H12.464C12.177 9.84 11.845 9.75 11.5 9.75C10.823 9.75 10.195 10.093 9.863 10.646L9.006 10.13C9.519 9.278 10.475 8.75 11.5 8.75C12.037 8.75 12.555 8.895 13 9.156V8.5H14V10.5Z" fill="var(--vscode-editorWarning-foreground, currentColor)"></path></svg>'},9336:k=>{k.exports='<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M13.807 2.265C13.228 1.532 12.313 1.141 11.083 1.004C9.877 0.870002 8.821 1.038 8.139 1.769C8.09 1.822 8.043 1.877 8 1.933C7.957 1.877 7.91 1.822 7.861 1.769C7.179 1.038 6.123 0.870002 4.917 1.004C3.687 1.141 2.772 1.532 2.193 2.265C1.628 2.981 1.5 3.879 1.5 4.75C1.5 5.322 1.553 5.897 1.754 6.405L1.586 7.243L1.52 7.276C0.588 7.742 0 8.694 0 9.736V11C0 11.24 0.086 11.438 0.156 11.567C0.231 11.704 0.325 11.828 0.415 11.933C0.595 12.143 0.819 12.346 1.02 12.513C1.225 12.684 1.427 12.836 1.577 12.943C1.816 13.116 2.062 13.275 2.318 13.423C2.625 13.6 3.066 13.832 3.614 14.065C4.391 14.395 5.404 14.722 6.553 14.887C6.203 14.377 5.931 13.809 5.751 13.202C5.173 13.055 4.645 12.873 4.201 12.684C3.717 12.479 3.331 12.274 3.067 12.123L3.002 12.085V7.824L3.025 7.709C3.515 7.919 4.1 8 4.752 8C5.898 8 6.812 7.672 7.462 7.009C7.681 6.785 7.859 6.535 8.002 6.266C8.049 6.354 8.106 6.436 8.16 6.52C8.579 6.238 9.038 6.013 9.522 5.843C9.26 5.52 9.077 5.057 8.996 4.407C8.879 3.471 9.034 3.011 9.238 2.793C9.431 2.586 9.875 2.379 10.919 2.495C11.939 2.608 12.398 2.899 12.632 3.195C12.879 3.508 13.002 3.984 13.002 4.75C13.002 5.158 12.967 5.453 12.909 5.674C13.398 5.792 13.865 5.967 14.3 6.197C14.443 5.741 14.502 5.248 14.502 4.75C14.502 3.879 14.374 2.981 13.809 2.265H13.807ZM7.006 4.407C6.915 5.133 6.704 5.637 6.388 5.959C6.089 6.264 5.604 6.5 4.75 6.5C3.828 6.5 3.47 6.301 3.308 6.12C3.129 5.92 3 5.542 3 4.75C3 3.984 3.123 3.508 3.37 3.195C3.604 2.899 4.063 2.609 5.083 2.495C6.127 2.379 6.571 2.586 6.764 2.793C6.968 3.011 7.123 3.471 7.006 4.407Z" fill="currentColor"></path><path d="M11.5 7C9.015 7 7 9.015 7 11.5C7 13.985 9.015 16 11.5 16C13.985 16 16 13.985 16 11.5C16 9.015 13.985 7 11.5 7ZM11.393 13.309L10.7 13.401L8.7 11.901L9.3 11.1L10.909 12.307L13.357 9.192L14.143 9.809L11.393 13.309Z" fill="var(--vscode-notebookStatusSuccessIcon-foreground, currentColor)"></path></svg>'},12158:k=>{k.exports='<svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path d="M6.25 9.016C6.66421 9.016 7 9.35089 7 9.76399V11.26C7 11.6731 6.66421 12.008 6.25 12.008C5.83579 12.008 5.5 11.6731 5.5 11.26V9.76399C5.5 9.35089 5.83579 9.016 6.25 9.016Z"></path><path d="M10.5 9.76399C10.5 9.35089 10.1642 9.016 9.75 9.016C9.33579 9.016 9 9.35089 9 9.76399V11.26C9 11.6731 9.33579 12.008 9.75 12.008C10.1642 12.008 10.5 11.6731 10.5 11.26V9.76399Z"></path><path d="M7.86079 1.80482C7.91028 1.8577 7.95663 1.91232 8 1.96856C8.04337 1.91232 8.08972 1.8577 8.13921 1.80482C8.82116 1.07611 9.87702 0.90832 11.0828 1.04194C12.3131 1.17827 13.2283 1.56829 13.8072 2.29916C14.3725 3.01276 14.5 3.90895 14.5 4.77735C14.5 5.34785 14.447 5.92141 14.2459 6.428L14.4135 7.26391L14.4798 7.29699C15.4115 7.76158 16 8.71126 16 9.7501V11.0107C16 11.2495 15.9143 11.4478 15.844 11.5763C15.7691 11.7131 15.6751 11.8368 15.5851 11.9416C15.4049 12.1512 15.181 12.3534 14.9801 12.5202C14.7751 12.6907 14.5728 12.8419 14.4235 12.9494C14.1842 13.1217 13.9389 13.2807 13.6826 13.4277C13.3756 13.6038 12.9344 13.8361 12.3867 14.0679C11.2956 14.5296 9.75604 15 8 15C6.24396 15 4.70442 14.5296 3.61334 14.0679C3.06559 13.8361 2.62435 13.6038 2.31739 13.4277C2.0611 13.2807 1.81581 13.1217 1.57651 12.9494C1.42716 12.8419 1.2249 12.6907 1.01986 12.5202C0.819 12.3534 0.595113 12.1512 0.414932 11.9416C0.3249 11.8368 0.230849 11.7131 0.156031 11.5763C0.0857453 11.4478 0 11.2495 1.90735e-06 11.0107L0 9.7501C0 8.71126 0.588507 7.76158 1.52017 7.29699L1.5865 7.26391L1.75413 6.42799C1.55295 5.9214 1.5 5.34785 1.5 4.77735C1.5 3.90895 1.62745 3.01276 2.19275 2.29916C2.77172 1.56829 3.68694 1.17827 4.91718 1.04194C6.12298 0.90832 7.17884 1.07611 7.86079 1.80482ZM3.0231 7.7282L3 7.8434V12.0931C3.02086 12.1053 3.04268 12.1179 3.06543 12.131C3.32878 12.2821 3.71567 12.4861 4.19916 12.6907C5.17058 13.1017 6.50604 13.504 8 13.504C9.49396 13.504 10.8294 13.1017 11.8008 12.6907C12.2843 12.4861 12.6712 12.2821 12.9346 12.131C12.9573 12.1179 12.9791 12.1053 13 12.0931V7.8434L12.9769 7.7282C12.4867 7.93728 11.9022 8.01867 11.25 8.01867C10.1037 8.01867 9.19051 7.69201 8.54033 7.03004C8.3213 6.80703 8.14352 6.55741 8 6.28924C7.85648 6.55741 7.6787 6.80703 7.45967 7.03004C6.80949 7.69201 5.89633 8.01867 4.75 8.01867C4.09776 8.01867 3.51325 7.93728 3.0231 7.7282ZM6.76421 2.82557C6.57116 2.61928 6.12702 2.41307 5.08282 2.52878C4.06306 2.64179 3.60328 2.93176 3.36975 3.22656C3.12255 3.53861 3 4.01374 3 4.77735C3 5.56754 3.12905 5.94499 3.3082 6.1441C3.47045 6.32443 3.82768 6.52267 4.75 6.52267C5.60367 6.52267 6.08903 6.28769 6.38811 5.98319C6.70349 5.66209 6.91507 5.1591 7.00579 4.43524C7.12274 3.50212 6.96805 3.04338 6.76421 2.82557ZM9.23579 2.82557C9.03195 3.04338 8.87726 3.50212 8.99421 4.43524C9.08493 5.1591 9.29651 5.66209 9.61189 5.98319C9.91097 6.28769 10.3963 6.52267 11.25 6.52267C12.1723 6.52267 12.5295 6.32443 12.6918 6.1441C12.871 5.94499 13 5.56754 13 4.77735C13 4.01374 12.8775 3.53861 12.6303 3.22656C12.3967 2.93176 11.9369 2.64179 10.9172 2.52878C9.87298 2.41307 9.42884 2.61928 9.23579 2.82557Z"></path></svg>'},37165:k=>{k.exports='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M5.75 1a.75.75 0 00-.75.75v3c0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75v-3a.75.75 0 00-.75-.75h-4.5zm.75 3V2.5h3V4h-3zm-2.874-.467a.75.75 0 00-.752-1.298A1.75 1.75 0 002 3.75v9.5c0 .966.784 1.75 1.75 1.75h8.5A1.75 1.75 0 0014 13.25v-9.5a1.75 1.75 0 00-.874-1.515.75.75 0 10-.752 1.298.25.25 0 01.126.217v9.5a.25.25 0 01-.25.25h-8.5a.25.25 0 01-.25-.25v-9.5a.25.25 0 01.126-.217z"></path></svg>'},38440:k=>{k.exports='<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 28 28" version="1.1"><g id="surface1"><path style=" stroke:none;fill-rule:evenodd;fill:#FFFFFF;fill-opacity:1;" d="M 14 0 C 6.265625 0 0 6.265625 0 14 C 0 20.195312 4.007812 25.425781 9.574219 27.285156 C 10.273438 27.402344 10.535156 26.984375 10.535156 26.617188 C 10.535156 26.285156 10.515625 25.183594 10.515625 24.011719 C 7 24.660156 6.089844 23.152344 5.808594 22.363281 C 5.652344 21.960938 4.972656 20.722656 4.375 20.386719 C 3.886719 20.125 3.183594 19.476562 4.359375 19.460938 C 5.460938 19.441406 6.246094 20.476562 6.511719 20.894531 C 7.769531 23.011719 9.785156 22.417969 10.585938 22.050781 C 10.710938 21.140625 11.078125 20.527344 11.480469 20.175781 C 8.363281 19.828125 5.109375 18.621094 5.109375 13.265625 C 5.109375 11.742188 5.652344 10.484375 6.546875 9.503906 C 6.402344 9.152344 5.914062 7.714844 6.683594 5.792969 C 6.683594 5.792969 7.859375 5.425781 10.535156 7.226562 C 11.652344 6.914062 12.847656 6.753906 14.035156 6.753906 C 15.226562 6.753906 16.414062 6.914062 17.535156 7.226562 C 20.210938 5.410156 21.386719 5.792969 21.386719 5.792969 C 22.152344 7.714844 21.664062 9.152344 21.523438 9.503906 C 22.417969 10.484375 22.960938 11.726562 22.960938 13.265625 C 22.960938 18.636719 19.6875 19.828125 16.574219 20.175781 C 17.078125 20.613281 17.515625 21.453125 17.515625 22.765625 C 17.515625 24.640625 17.5 26.144531 17.5 26.617188 C 17.5 26.984375 17.761719 27.421875 18.460938 27.285156 C 24.160156 25.359375 27.996094 20.015625 28 14 C 28 6.265625 21.734375 0 14 0 Z M 14 0 "></path></g></svg>'},46279:k=>{k.exports='<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M10 3h3v1h-1v9l-1 1H4l-1-1V4H2V3h3V2a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v1zM9 2H6v1h3V2zM4 13h7V4H4v9zm2-8H5v7h1V5zm1 0h1v7H7V5zm2 0h1v7H9V5z" fill="#cccccc"></path></svg>'},19443:k=>{k.exports='<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 4C8.35556 4 8.71111 4.05333 9.06667 4.16C9.74222 4.33778 10.3289 4.67556 10.8267 5.17333C11.3244 5.67111 11.6622 6.25778 11.84 6.93333C11.9467 7.28889 12 7.64444 12 8C12 8.35556 11.9467 8.71111 11.84 9.06667C11.6622 9.74222 11.3244 10.3289 10.8267 10.8267C10.3289 11.3244 9.74222 11.6622 9.06667 11.84C8.71111 11.9467 8.35556 12 8 12C7.64444 12 7.28889 11.9467 6.93333 11.84C6.25778 11.6622 5.67111 11.3244 5.17333 10.8267C4.67556 10.3289 4.33778 9.74222 4.16 9.06667C4.05333 8.71111 4 8.35556 4 8C4 7.64444 4.03556 7.30667 4.10667 6.98667C4.21333 6.63111 4.35556 6.29333 4.53333 5.97333C4.88889 5.36889 5.36889 4.88889 5.97333 4.53333C6.29333 4.35556 6.61333 4.23111 6.93333 4.16C7.28889 4.05333 7.64444 4 8 4Z" fill="#CCCCCC"></path></svg>'},83962:k=>{k.exports='<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M2.40706 15L1 13.5929L3.35721 9.46781L3.52339 9.25025L11.7736 1L13.2321 1L15 2.76791V4.22636L6.74975 12.4766L6.53219 12.6428L2.40706 15ZM2.40706 13.5929L6.02053 11.7474L14.2708 3.49714L12.5029 1.72923L4.25262 9.97947L2.40706 13.5929Z" fill="#C5C5C5"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M5.64642 12.3536L3.64642 10.3536L4.35353 9.64645L6.35353 11.6464L5.64642 12.3536Z" fill="#C5C5C5"></path></svg>'},93492:k=>{k.exports='<svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path fill-rule="evenodd" clip-rule="evenodd" d="M8.6 1c1.6.1 3.1.9 4.2 2 1.3 1.4 2 3.1 2 5.1 0 1.6-.6 3.1-1.6 4.4-1 1.2-2.4 2.1-4 2.4-1.6.3-3.2.1-4.6-.7-1.4-.8-2.5-2-3.1-3.5C.9 9.2.8 7.5 1.3 6c.5-1.6 1.4-2.9 2.8-3.8C5.4 1.3 7 .9 8.6 1zm.5 12.9c1.3-.3 2.5-1 3.4-2.1.8-1.1 1.3-2.4 1.2-3.8 0-1.6-.6-3.2-1.7-4.3-1-1-2.2-1.6-3.6-1.7-1.3-.1-2.7.2-3.8 1-1.1.8-1.9 1.9-2.3 3.3-.4 1.3-.4 2.7.2 4 .6 1.3 1.5 2.3 2.7 3 1.2.7 2.6.9 3.9.6zM7.9 7.5L10.3 5l.7.7-2.4 2.5 2.4 2.5-.7.7-2.4-2.5-2.4 2.5-.7-.7 2.4-2.5-2.4-2.5.7-.7 2.4 2.5z"></path></svg>'},92359:k=>{k.exports='<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9.1 4.4L8.6 2H7.4L6.9 4.4L6.2 4.7L4.2 3.4L3.3 4.2L4.6 6.2L4.4 6.9L2 7.4V8.6L4.4 9.1L4.7 9.9L3.4 11.9L4.2 12.7L6.2 11.4L7 11.7L7.4 14H8.6L9.1 11.6L9.9 11.3L11.9 12.6L12.7 11.8L11.4 9.8L11.7 9L14 8.6V7.4L11.6 6.9L11.3 6.1L12.6 4.1L11.8 3.3L9.8 4.6L9.1 4.4ZM9.4 1L9.9 3.4L12 2.1L14 4.1L12.6 6.2L15 6.6V9.4L12.6 9.9L14 12L12 14L9.9 12.6L9.4 15H6.6L6.1 12.6L4 13.9L2 11.9L3.4 9.8L1 9.4V6.6L3.4 6.1L2.1 4L4.1 2L6.2 3.4L6.6 1H9.4ZM10 8C10 9.1 9.1 10 8 10C6.9 10 6 9.1 6 8C6 6.9 6.9 6 8 6C9.1 6 10 6.9 10 8ZM8 9C8.6 9 9 8.6 9 8C9 7.4 8.6 7 8 7C7.4 7 7 7.4 7 8C7 8.6 7.4 9 8 9Z" fill="#C5C5C5"></path></svg>'},80459:k=>{k.exports='<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M6.00012 13H7.00012L7.00012 7.00001L13.0001 7.00001V6.00001L7.00012 6.00001L7.00012 3H6.00012L6.00012 6.00001L3.00012 6.00001V7.00001H6.00012L6.00012 13Z" fill="#C5C5C5"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M2.50012 2H13.5001L14.0001 2.5V13.5L13.5001 14H2.50012L2.00012 13.5V2.5L2.50012 2ZM3.00012 13H13.0001V3H3.00012V13Z" fill="#C5C5C5"></path></svg>'},40027:k=>{k.exports='<svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path d="M7.50002 1C6.21445 1 4.95774 1.38123 3.88882 2.09546C2.8199 2.80969 1.98674 3.82485 1.49478 5.01257C1.00281 6.20029 0.874098 7.50719 1.1249 8.76807C1.37571 10.0289 1.99479 11.1872 2.90383 12.0962C3.81287 13.0052 4.97108 13.6243 6.23196 13.8751C7.49283 14.1259 8.79973 13.9972 9.98745 13.5052C11.1752 13.0133 12.1903 12.1801 12.9046 11.1112C13.6188 10.0423 14 8.78558 14 7.5C14 5.77609 13.3152 4.1228 12.0962 2.90381C10.8772 1.68482 9.22393 1 7.50002 1ZM7.50002 13C6.41223 13 5.34883 12.6775 4.44436 12.0731C3.53989 11.4688 2.83501 10.6097 2.41873 9.60474C2.00244 8.59974 1.89352 7.4939 2.10574 6.427C2.31796 5.36011 2.8418 4.38015 3.61099 3.61096C4.38018 2.84177 5.36013 2.31793 6.42703 2.10571C7.49392 1.89349 8.59977 2.00242 9.60476 2.4187C10.6098 2.83498 11.4688 3.53987 12.0731 4.44434C12.6775 5.34881 13 6.4122 13 7.5C13 8.95869 12.4205 10.3576 11.3891 11.389C10.3576 12.4205 8.95871 13 7.50002 13Z"></path><circle cx="7.50002" cy="7.5" r="1"></circle></svg>'},64674:k=>{k.exports='<svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path d="M6.27 10.87h.71l4.56-4.56-.71-.71-4.2 4.21-1.92-1.92L4 8.6l2.27 2.27z"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M8.6 1c1.6.1 3.1.9 4.2 2 1.3 1.4 2 3.1 2 5.1 0 1.6-.6 3.1-1.6 4.4-1 1.2-2.4 2.1-4 2.4-1.6.3-3.2.1-4.6-.7-1.4-.8-2.5-2-3.1-3.5C.9 9.2.8 7.5 1.3 6c.5-1.6 1.4-2.9 2.8-3.8C5.4 1.3 7 .9 8.6 1zm.5 12.9c1.3-.3 2.5-1 3.4-2.1.8-1.1 1.3-2.4 1.2-3.8 0-1.6-.6-3.2-1.7-4.3-1-1-2.2-1.6-3.6-1.7-1.3-.1-2.7.2-3.8 1-1.1.8-1.9 1.9-2.3 3.3-.4 1.3-.4 2.7.2 4 .6 1.3 1.5 2.3 2.7 3 1.2.7 2.6.9 3.9.6z"></path></svg>'},5064:k=>{k.exports='<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M13.2002 2H8.01724L7.66424 2.146L1.00024 8.81V9.517L6.18324 14.7H6.89024L9.10531 12.4853C9.65832 12.7768 10.2677 12.9502 10.8945 12.9923C11.659 13.0437 12.424 12.8981 13.1162 12.5694C13.8085 12.2407 14.4048 11.74 14.8483 11.1151C15.2918 10.4902 15.5676 9.76192 15.6492 9H15.6493C15.6759 8.83446 15.6929 8.66751 15.7003 8.5C15.6989 7.30693 15.2244 6.16311 14.3808 5.31948C14.1712 5.10988 13.9431 4.92307 13.7002 4.76064V2.5L13.2002 2ZM12.7002 4.25881C12.223 4.08965 11.7162 4.00057 11.2003 4C11.0676 4 10.9405 4.05268 10.8467 4.14645C10.7529 4.24021 10.7003 4.36739 10.7003 4.5C10.7003 4.63261 10.7529 4.75979 10.8467 4.85355C10.9405 4.94732 11.0676 5 11.2003 5C11.7241 5 12.2358 5.11743 12.7002 5.33771V7.476L8.77506 11.4005C8.75767 11.4095 8.74079 11.4194 8.72449 11.4304C8.6685 11.468 8.6207 11.5166 8.58397 11.5731C8.57475 11.5874 8.56627 11.602 8.55856 11.617L6.53624 13.639L2.06124 9.163L8.22424 3H12.7002V4.25881ZM13.7002 6.0505C14.3409 6.70435 14.7003 7.58365 14.7003 8.5C14.6955 8.66769 14.6784 8.8348 14.6493 9H14.6492C14.5675 9.58097 14.3406 10.1319 13.9894 10.6019C13.6383 11.0719 13.1743 11.4457 12.6403 11.6888C12.1063 11.9319 11.5197 12.0363 10.9346 11.9925C10.5622 11.9646 10.1982 11.8772 9.85588 11.7348L13.5542 8.037L13.7002 7.683V6.0505Z" fill="#C5C5C5"></path></svg>'},95570:k=>{k.exports='<svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path fill-rule="evenodd" clip-rule="evenodd" d="M13.917 7A6.002 6.002 0 0 0 2.083 7H1.071a7.002 7.002 0 0 1 13.858 0h-1.012z"></path></svg>'},90346:k=>{k.exports='<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M4.99008 1C4.5965 1 4.21175 1.11671 3.8845 1.33538C3.55724 1.55404 3.30218 1.86484 3.15156 2.22846C3.00094 2.59208 2.96153 2.99221 3.03832 3.37823C3.1151 3.76425 3.30463 4.11884 3.58294 4.39714C3.83589 4.65009 4.15185 4.8297 4.49715 4.91798L4.49099 10.8286C4.40192 10.8517 4.31421 10.881 4.22852 10.9165C3.8649 11.0671 3.5541 11.3222 3.33544 11.6494C3.11677 11.9767 3.00006 12.3614 3.00006 12.755C3.00006 13.2828 3.20972 13.7889 3.58292 14.1621C3.95612 14.5353 4.46228 14.745 4.99006 14.745C5.38365 14.745 5.76839 14.6283 6.09565 14.4096C6.4229 14.191 6.67796 13.8802 6.82858 13.5165C6.9792 13.1529 7.01861 12.7528 6.94182 12.3668C6.86504 11.9807 6.67551 11.6262 6.3972 11.3479C6.14426 11.0949 5.8283 10.9153 5.48299 10.827V9.745H5.48915V8.80133C6.50043 10.3332 8.19531 11.374 10.1393 11.4893C10.2388 11.7413 10.3893 11.9714 10.5825 12.1648C10.8608 12.4432 11.2154 12.6328 11.6014 12.7097C11.9875 12.7866 12.3877 12.7472 12.7513 12.5966C13.115 12.446 13.4259 12.191 13.6446 11.8637C13.8633 11.5364 13.98 11.1516 13.98 10.758C13.98 10.2304 13.7705 9.72439 13.3975 9.35122C13.0245 8.97805 12.5186 8.76827 11.991 8.76801C11.5974 8.76781 11.2126 8.88435 10.8852 9.10289C10.5578 9.32144 10.3026 9.63216 10.1518 9.99577C10.0875 10.1509 10.0434 10.3127 10.0199 10.4772C7.48375 10.2356 5.48915 8.09947 5.48915 5.5C5.48915 5.33125 5.47282 5.16445 5.48915 5V4.9164C5.57823 4.89333 5.66594 4.86401 5.75162 4.82852C6.11525 4.6779 6.42604 4.42284 6.64471 4.09558C6.86337 3.76833 6.98008 3.38358 6.98008 2.99C6.98008 2.46222 6.77042 1.95605 6.39722 1.58286C6.02403 1.20966 5.51786 1 4.99008 1ZM4.99008 2C5.18593 1.9998 5.37743 2.0577 5.54037 2.16636C5.70331 2.27502 5.83035 2.42957 5.90544 2.61045C5.98052 2.79133 6.00027 2.99042 5.96218 3.18253C5.9241 3.37463 5.82989 3.55113 5.69147 3.68968C5.55306 3.82824 5.37666 3.92262 5.18459 3.9609C4.99252 3.99918 4.79341 3.97964 4.61246 3.90474C4.4315 3.82983 4.27682 3.70294 4.168 3.54012C4.05917 3.37729 4.00108 3.18585 4.00108 2.99C4.00135 2.72769 4.1056 2.47618 4.29098 2.29061C4.47637 2.10503 4.72777 2.00053 4.99008 2ZM4.99006 13.745C4.79422 13.7452 4.60271 13.6873 4.43977 13.5786C4.27684 13.47 4.14979 13.3154 4.07471 13.1345C3.99962 12.9537 3.97988 12.7546 4.01796 12.5625C4.05605 12.3704 4.15026 12.1939 4.28867 12.0553C4.42709 11.9168 4.60349 11.8224 4.79555 11.7841C4.98762 11.7458 5.18673 11.7654 5.36769 11.8403C5.54864 11.9152 5.70332 12.0421 5.81215 12.2049C5.92097 12.3677 5.97906 12.5591 5.97906 12.755C5.9788 13.0173 5.87455 13.2688 5.68916 13.4544C5.50377 13.64 5.25237 13.7445 4.99006 13.745ZM11.991 9.76801C12.1868 9.76801 12.3782 9.82607 12.541 9.93485C12.7038 10.0436 12.8307 10.1983 12.9057 10.3791C12.9806 10.56 13.0002 10.7591 12.962 10.9511C12.9238 11.1432 12.8295 11.3196 12.6911 11.458C12.5526 11.5965 12.3762 11.6908 12.1842 11.729C11.9921 11.7672 11.7931 11.7476 11.6122 11.6726C11.4313 11.5977 11.2767 11.4708 11.1679 11.308C11.0591 11.1452 11.001 10.9538 11.001 10.758C11.0013 10.4955 11.1057 10.2439 11.2913 10.0583C11.4769 9.87266 11.7285 9.76827 11.991 9.76801Z" fill="#C5C5C5"></path></svg>'},44370:k=>{k.exports='<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M10.5002 4.64639L8.35388 2.5H7.64677L5.50034 4.64639L6.20744 5.35349L7.3003 4.26066V5.27972H7.28082V5.73617L7.30568 5.73717C7.30768 5.84794 7.30968 5.95412 7.31169 6.05572C7.31538 6.24322 7.33201 6.43462 7.36158 6.62994C7.39114 6.82525 7.42994 7.02056 7.47799 7.21587C7.52603 7.41119 7.59255 7.62017 7.67755 7.84283C7.83276 8.22173 8.02124 8.56548 8.24297 8.87408C8.4647 9.18267 8.70307 9.47173 8.95806 9.74127C9.21306 10.0108 9.46621 10.2764 9.71751 10.5381C9.9688 10.7999 10.1961 11.0792 10.3993 11.376C10.6026 11.6729 10.767 11.9971 10.8927 12.3487C11.0183 12.7002 11.0812 13.1045 11.0812 13.5616V14.4463H12.5003V13.5616C12.4929 13.042 12.4375 12.5792 12.334 12.1729C12.2305 11.7667 12.0882 11.3995 11.9071 11.0713C11.7261 10.7432 11.5246 10.4444 11.3029 10.1749C11.0812 9.90533 10.8502 9.64752 10.61 9.40142C10.3698 9.15533 10.1388 8.90923 9.91707 8.66314C9.69533 8.41705 9.49392 8.15533 9.31284 7.87798C9.13176 7.60064 8.98763 7.29595 8.88046 6.96392C8.77329 6.63189 8.7197 6.25494 8.7197 5.83306V5.27972H8.71901V4.27935L9.79314 5.3535L10.5002 4.64639ZM7.04245 9.74127C7.15517 9.62213 7.26463 9.49917 7.37085 9.3724C7.12665 9.01878 6.92109 8.63423 6.75218 8.22189L6.74317 8.19952C6.70951 8.11134 6.67794 8.02386 6.6486 7.93713C6.47774 8.19261 6.28936 8.43461 6.08345 8.66314C5.86172 8.90923 5.63074 9.15533 5.39053 9.40142C5.15032 9.64752 4.91935 9.90533 4.69761 10.1749C4.47588 10.4444 4.27447 10.7432 4.09338 11.0713C3.9123 11.3995 3.77002 11.7667 3.66654 12.1729C3.56307 12.5792 3.50764 13.042 3.50024 13.5616V14.4463H4.91935V13.5616C4.91935 13.1045 4.98217 12.7002 5.10782 12.3487C5.23347 11.9971 5.39792 11.6729 5.60118 11.376C5.80444 11.0792 6.03171 10.7999 6.28301 10.5381C6.53431 10.2764 6.78746 10.0108 7.04245 9.74127Z" fill="#424242"></path></svg>'},20628:k=>{k.exports='<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M7.99976 1H6.99976V3H1.49976L0.999756 3.5V7.5L1.49976 8H6.99976V15H7.99976V8H12.4898L12.8298 7.87L15.0098 5.87V5.13L12.8298 3.13L12.4998 3H7.99976V1ZM12.2898 7H1.99976V4H12.2898L13.9198 5.5L12.2898 7ZM4.99976 5H9.99976V6H4.99976V5Z" fill="#C5C5C5"></path></svg>'},15010:k=>{k.exports='<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14 7V8H8V14H7V8H1V7H7V1H8V7H14Z" fill="#C5C5C5"></path></svg>'},14268:k=>{k.exports='<svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path fill-rule="evenodd" clip-rule="evenodd" d="M5.616 4.928a2.487 2.487 0 0 1-1.119.922c-.148.06-.458.138-.458.138v5.008a2.51 2.51 0 0 1 1.579 1.062c.273.412.419.895.419 1.388.008.343-.057.684-.19 1A2.485 2.485 0 0 1 3.5 15.984a2.482 2.482 0 0 1-1.388-.419A2.487 2.487 0 0 1 1.05 13c.095-.486.331-.932.68-1.283.349-.343.79-.579 1.269-.68V5.949a2.6 2.6 0 0 1-1.269-.68 2.503 2.503 0 0 1-.68-1.283 2.487 2.487 0 0 1 1.06-2.565A2.49 2.49 0 0 1 3.5 1a2.504 2.504 0 0 1 1.807.729 2.493 2.493 0 0 1 .729 1.81c.002.494-.144.978-.42 1.389zm-.756 7.861a1.5 1.5 0 0 0-.552-.579 1.45 1.45 0 0 0-.77-.21 1.495 1.495 0 0 0-1.47 1.79 1.493 1.493 0 0 0 1.18 1.179c.288.058.586.03.86-.08.276-.117.512-.312.68-.56.15-.226.235-.49.249-.76a1.51 1.51 0 0 0-.177-.78zM2.708 4.741c.247.161.536.25.83.25.271 0 .538-.075.77-.211a1.514 1.514 0 0 0 .729-1.359 1.513 1.513 0 0 0-.25-.76 1.551 1.551 0 0 0-.68-.56 1.49 1.49 0 0 0-.86-.08 1.494 1.494 0 0 0-1.179 1.18c-.058.288-.03.586.08.86.117.276.312.512.56.68zm10.329 6.296c.48.097.922.335 1.269.68.466.47.729 1.107.725 1.766.002.493-.144.977-.42 1.388a2.499 2.499 0 0 1-4.532-.899 2.5 2.5 0 0 1 1.067-2.565c.267-.183.571-.308.889-.37V5.489a1.5 1.5 0 0 0-1.5-1.499H8.687l1.269 1.27-.71.709L7.117 3.84v-.7l2.13-2.13.71.711-1.269 1.27h1.85a2.484 2.484 0 0 1 2.312 1.541c.125.302.189.628.187.957v5.548zm.557 3.509a1.493 1.493 0 0 0 .191-1.89 1.552 1.552 0 0 0-.68-.559 1.49 1.49 0 0 0-.86-.08 1.493 1.493 0 0 0-1.179 1.18 1.49 1.49 0 0 0 .08.86 1.496 1.496 0 0 0 2.448.49z"></path></svg>'},30340:k=>{k.exports='<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M7.38893 12.9906L6.11891 11.7205L6.78893 11.0206L8.91893 13.1506V13.8505L6.78893 15.9805L6.07893 15.2706L7.34892 14.0006H5.49892C5.17024 14.0019 4.84458 13.9381 4.54067 13.8129C4.23675 13.6878 3.96061 13.5037 3.7282 13.2713C3.49579 13.0389 3.31171 12.7627 3.18654 12.4588C3.06137 12.1549 2.99759 11.8292 2.99892 11.5006V5.95052C2.5198 5.84851 2.07944 5.61279 1.72893 5.27059C1.3808 4.91884 1.14393 4.47238 1.0479 3.98689C0.951867 3.50141 1.00092 2.9984 1.18892 2.54061C1.37867 2.08436 1.69938 1.69458 2.11052 1.42049C2.52166 1.14639 3.00479 1.00024 3.49892 1.00057C3.84188 0.993194 4.18256 1.05787 4.49892 1.19051C4.80197 1.31518 5.07732 1.49871 5.30904 1.73042C5.54075 1.96214 5.72425 2.23755 5.84892 2.54061C5.98157 2.85696 6.0463 3.19765 6.03893 3.54061C6.03926 4.03474 5.89316 4.51789 5.61906 4.92903C5.34497 5.34017 4.95516 5.6608 4.49892 5.85054C4.35057 5.91224 4.19649 5.95915 4.03893 5.99056V11.4906C4.03893 11.8884 4.19695 12.2699 4.47826 12.5512C4.75956 12.8325 5.1411 12.9906 5.53893 12.9906H7.38893ZM2.70894 4.74056C2.95497 4.90376 3.24368 4.99072 3.53893 4.99056C3.81026 4.99066 4.07654 4.91718 4.3094 4.77791C4.54227 4.63864 4.73301 4.43877 4.86128 4.19966C4.98956 3.96056 5.05057 3.69116 5.03783 3.42012C5.02508 3.14908 4.93907 2.88661 4.78893 2.6606C4.62119 2.4121 4.38499 2.21751 4.10893 2.10054C3.83645 1.98955 3.53719 1.96176 3.24892 2.02059C2.95693 2.07705 2.68852 2.2196 2.47823 2.42989C2.26793 2.64018 2.12539 2.90853 2.06892 3.20052C2.0101 3.4888 2.03792 3.78802 2.14891 4.0605C2.26588 4.33656 2.46043 4.57282 2.70894 4.74056ZM13.0389 11.0406C13.5196 11.1384 13.9612 11.3747 14.309 11.7206C14.7766 12.191 15.039 12.8273 15.0389 13.4906C15.0393 13.9847 14.8932 14.4679 14.6191 14.879C14.345 15.2902 13.9552 15.6109 13.499 15.8007C13.0416 15.9915 12.5378 16.0421 12.0516 15.946C11.5654 15.85 11.1187 15.6117 10.7683 15.2612C10.4179 14.9108 10.1795 14.4641 10.0835 13.9779C9.98746 13.4917 10.0381 12.988 10.2289 12.5306C10.4218 12.0768 10.7412 11.688 11.1489 11.4106C11.4177 11.2286 11.7204 11.1028 12.0389 11.0406V5.4906C12.0389 5.09278 11.8809 4.71124 11.5996 4.42993C11.3183 4.14863 10.9368 3.9906 10.5389 3.9906H8.68896L9.95892 5.26062L9.24896 5.97058L7.11893 3.84058V3.14063L9.24896 1.01062L9.95892 1.72058L8.68896 2.9906H10.5389C10.8676 2.98928 11.1933 3.05305 11.4972 3.17822C11.8011 3.30339 12.0772 3.48744 12.3096 3.71985C12.542 3.95226 12.7262 4.22844 12.8513 4.53235C12.9765 4.83626 13.0403 5.16193 13.0389 5.4906V11.0406ZM12.6879 14.9829C13.0324 14.9483 13.3542 14.7956 13.5989 14.5507C13.8439 14.306 13.9966 13.984 14.0313 13.6395C14.0659 13.295 13.9803 12.9492 13.7889 12.6606C13.6212 12.4121 13.385 12.2176 13.1089 12.1006C12.8365 11.9896 12.5372 11.9618 12.249 12.0206C11.957 12.0771 11.6886 12.2196 11.4783 12.4299C11.268 12.6402 11.1254 12.9086 11.069 13.2006C11.0101 13.4888 11.0379 13.7881 11.1489 14.0605C11.2659 14.3366 11.4604 14.5729 11.7089 14.7406C11.9975 14.9319 12.3434 15.0175 12.6879 14.9829Z" fill="#C5C5C5"></path></svg>'},90659:k=>{k.exports='<svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path fill-rule="evenodd" clip-rule="evenodd" d="M5.61594 4.92769C5.34304 5.33899 4.95319 5.66062 4.49705 5.8497C4.34891 5.91013 4.03897 5.9881 4.03897 5.9881V10.9958C4.19686 11.027 4.35086 11.0738 4.499 11.1362C4.95513 11.3272 5.34304 11.6469 5.61789 12.0582C5.89079 12.4695 6.03699 12.9529 6.03699 13.4461C6.04478 13.7891 5.98046 14.1303 5.84791 14.446C5.72315 14.7482 5.53992 15.023 5.30796 15.255C5.07794 15.487 4.80114 15.6702 4.499 15.7949C4.18322 15.9275 3.84209 15.9918 3.49902 15.984C3.00585 15.986 2.52243 15.8398 2.11113 15.5649C1.69983 15.292 1.3782 14.9022 1.18912 14.446C1.00198 13.988 0.953253 13.485 1.04877 12.9997C1.14428 12.5143 1.38015 12.0679 1.72907 11.717C2.07799 11.374 2.51853 11.1381 2.99805 11.0367V5.94911C2.52048 5.8458 2.07994 5.61189 1.72907 5.26881C1.38015 4.91794 1.14428 4.47155 1.04877 3.98618C0.951304 3.50081 1.00004 2.99789 1.18912 2.53981C1.3782 2.08368 1.69983 1.69382 2.11113 1.42092C2.52048 1.14607 3.0039 0.999877 3.49902 0.999877C3.84014 0.99403 4.18127 1.05836 4.49705 1.18896C4.79919 1.31371 5.07404 1.49695 5.30601 1.72891C5.53797 1.96087 5.7212 2.23767 5.84596 2.53981C5.97851 2.8556 6.04284 3.19672 6.03504 3.5398C6.03699 4.03296 5.89079 4.51639 5.61594 4.92769ZM4.85962 12.7892C4.73097 12.5494 4.53994 12.3486 4.30797 12.2102C4.07601 12.0699 3.80896 11.9958 3.538 11.9997C3.24171 11.9997 2.95322 12.0855 2.70761 12.2492C2.46005 12.4168 2.26512 12.6527 2.14816 12.9295C2.03706 13.2024 2.00977 13.5006 2.06824 13.7891C2.12477 14.0796 2.26707 14.3486 2.47759 14.5591C2.68812 14.7696 2.95517 14.9119 3.24756 14.9685C3.53606 15.0269 3.8343 14.9996 4.1072 14.8885C4.38399 14.7716 4.61986 14.5766 4.7875 14.3291C4.93759 14.103 5.02336 13.8398 5.037 13.5689C5.0487 13.2979 4.98827 13.0289 4.85962 12.7892ZM2.70761 4.74056C2.95517 4.90235 3.24366 4.99006 3.538 4.99006C3.80896 4.99006 4.07601 4.91599 4.30797 4.77954C4.53994 4.63919 4.73097 4.44037 4.85962 4.2006C4.98827 3.96084 5.05065 3.69184 5.037 3.42089C5.02336 3.14994 4.93759 2.88679 4.7875 2.66067C4.61986 2.41311 4.38399 2.21818 4.1072 2.10122C3.8343 1.99011 3.53606 1.96282 3.24756 2.0213C2.95712 2.07783 2.68812 2.22013 2.47759 2.43065C2.26707 2.64118 2.12477 2.90823 2.06824 3.20062C2.00977 3.48911 2.03706 3.78735 2.14816 4.06025C2.26512 4.33705 2.46005 4.57292 2.70761 4.74056ZM13.0368 11.0368C13.5164 11.1342 13.9588 11.372 14.3058 11.7171C14.7717 12.1868 15.0348 12.8243 15.0309 13.4831C15.0329 13.9763 14.8867 14.4597 14.6119 14.871C14.339 15.2823 13.9491 15.6039 13.493 15.793C13.0368 15.984 12.532 16.0347 12.0466 15.9392C11.5612 15.8437 11.1148 15.6059 10.764 15.255C10.415 14.9041 10.1753 14.4578 10.0798 13.9724C9.98425 13.487 10.0349 12.9841 10.226 12.526C10.4189 12.0738 10.7386 11.6839 11.146 11.4071C11.4131 11.2239 11.7172 11.0991 12.0349 11.0368V7.4891H13.0368V11.0368ZM13.5943 14.5455C13.8399 14.3018 13.992 13.9802 14.0271 13.6352C14.0622 13.2921 13.9764 12.9451 13.7854 12.6566C13.6177 12.4091 13.3819 12.2141 13.1051 12.0972C12.8322 11.9861 12.5339 11.9588 12.2454 12.0173C11.955 12.0738 11.686 12.2161 11.4755 12.4266C11.2649 12.6371 11.1226 12.9042 11.0661 13.1966C11.0076 13.4851 11.0349 13.7833 11.146 14.0562C11.263 14.333 11.4579 14.5689 11.7055 14.7365C11.994 14.9275 12.339 15.0133 12.684 14.9782C13.0271 14.9431 13.3507 14.7911 13.5943 14.5455Z"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M11.6876 3.40036L10 5.088L10.7071 5.7951L12.3947 4.10747L14.0824 5.7951L14.7895 5.088L13.1019 3.40036L14.7895 1.71272L14.0824 1.00562L12.3947 2.69325L10.7071 1.00562L10 1.71272L11.6876 3.40036Z"></path></svg>'},83344:k=>{k.exports='<svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path d="M4.49705 5.8497C4.95319 5.66062 5.34304 5.33899 5.61594 4.92769C5.89079 4.51639 6.03699 4.03296 6.03504 3.5398C6.04284 3.19672 5.97851 2.8556 5.84596 2.53981C5.7212 2.23767 5.53797 1.96087 5.30601 1.72891C5.07404 1.49695 4.79919 1.31371 4.49705 1.18896C4.18127 1.05836 3.84014 0.99403 3.49902 0.999877C3.0039 0.999877 2.52048 1.14607 2.11113 1.42092C1.69983 1.69382 1.3782 2.08368 1.18912 2.53981C1.00004 2.99789 0.951304 3.50081 1.04877 3.98618C1.14428 4.47155 1.38015 4.91794 1.72907 5.26881C2.07994 5.61189 2.52048 5.8458 2.99805 5.94911V11.0367C2.51853 11.1381 2.07799 11.374 1.72907 11.717C1.38015 12.0679 1.14428 12.5143 1.04877 12.9997C0.953253 13.485 1.00198 13.988 1.18912 14.446C1.3782 14.9022 1.69983 15.292 2.11113 15.5649C2.52243 15.8398 3.00585 15.986 3.49902 15.984C3.84209 15.9918 4.18322 15.9275 4.499 15.7949C4.80114 15.6702 5.07794 15.487 5.30796 15.255C5.53992 15.023 5.72315 14.7482 5.84791 14.446C5.98046 14.1303 6.04478 13.7891 6.03699 13.4461C6.03699 12.9529 5.89079 12.4695 5.61789 12.0582C5.34304 11.6469 4.95513 11.3272 4.499 11.1362C4.35086 11.0738 4.19686 11.027 4.03897 10.9958V5.9881C4.03897 5.9881 4.34891 5.91013 4.49705 5.8497ZM4.30797 12.2102C4.53994 12.3486 4.73097 12.5494 4.85962 12.7892C4.98827 13.0289 5.0487 13.2979 5.037 13.5689C5.02336 13.8398 4.93759 14.103 4.7875 14.3291C4.61986 14.5766 4.38399 14.7716 4.1072 14.8885C3.8343 14.9996 3.53606 15.0269 3.24756 14.9685C2.95517 14.9119 2.68812 14.7696 2.47759 14.5591C2.26707 14.3486 2.12477 14.0796 2.06824 13.7891C2.00977 13.5006 2.03706 13.2024 2.14816 12.9295C2.26512 12.6527 2.46005 12.4168 2.70761 12.2492C2.95322 12.0855 3.24171 11.9997 3.538 11.9997C3.80896 11.9958 4.07601 12.0699 4.30797 12.2102ZM3.538 4.99006C3.24366 4.99006 2.95517 4.90235 2.70761 4.74056C2.46005 4.57292 2.26512 4.33705 2.14816 4.06025C2.03706 3.78735 2.00977 3.48911 2.06824 3.20062C2.12477 2.90823 2.26707 2.64118 2.47759 2.43065C2.68812 2.22013 2.95712 2.07783 3.24756 2.0213C3.53606 1.96282 3.8343 1.99011 4.1072 2.10122C4.38399 2.21818 4.61986 2.41311 4.7875 2.66067C4.93759 2.88679 5.02336 3.14994 5.037 3.42089C5.05065 3.69184 4.98827 3.96084 4.85962 4.2006C4.73097 4.44037 4.53994 4.63919 4.30797 4.77954C4.07601 4.91599 3.80896 4.99006 3.538 4.99006Z"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M15.0543 13.5C15.0543 14.8807 13.935 16 12.5543 16C11.1736 16 10.0543 14.8807 10.0543 13.5C10.0543 12.1193 11.1736 11 12.5543 11C13.935 11 15.0543 12.1193 15.0543 13.5ZM12.5543 15C13.3827 15 14.0543 14.3284 14.0543 13.5C14.0543 12.6716 13.3827 12 12.5543 12C11.7258 12 11.0543 12.6716 11.0543 13.5C11.0543 14.3284 11.7258 15 12.5543 15Z"></path><circle cx="12.5543" cy="7.75073" r="1"></circle><circle cx="12.5543" cy="3.50146" r="1"></circle></svg>'},9649:k=>{k.exports='<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M2.14648 6.3065L6.16649 2.2865L6.87359 2.2865L10.8936 6.3065L10.1865 7.0136L6.97998 3.8071L6.97998 5.69005C6.97998 8.50321 7.58488 10.295 8.70856 11.3953C9.83407 12.4974 11.5857 13.0101 14.13 13.0101L14.48 13.0101L14.48 14.0101L14.13 14.0101C11.4843 14.0101 9.4109 13.4827 8.00891 12.1098C6.60509 10.7351 5.97998 8.61689 5.97998 5.69005L5.97998 3.88722L2.85359 7.01361L2.14648 6.3065Z" fill="#C5C5C5"></path></svg>'},72362:k=>{k.exports='<svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path fill-rule="evenodd" clip-rule="evenodd" d="M7.16 3.5C4.73 5.06 3.55 6.67 3.55 9.36c.16-.05.3-.05.44-.05 1.27 0 2.5.86 2.5 2.41 0 1.61-1.03 2.61-2.5 2.61-1.9 0-2.99-1.52-2.99-4.25 0-3.8 1.75-6.53 5.02-8.42L7.16 3.5zm7 0c-2.43 1.56-3.61 3.17-3.61 5.86.16-.05.3-.05.44-.05 1.27 0 2.5.86 2.5 2.41 0 1.61-1.03 2.61-2.5 2.61-1.89 0-2.98-1.52-2.98-4.25 0-3.8 1.75-6.53 5.02-8.42l1.14 1.84h-.01z"></path></svg>'},98923:k=>{k.exports='<svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path fill-rule="evenodd" clip-rule="evenodd" d="M10.7099 1.29L13.7099 4.29L13.9999 5V14L12.9999 15H3.99994L2.99994 14V2L3.99994 1H9.99994L10.7099 1.29ZM3.99994 14H12.9999V5L9.99994 2H3.99994V14ZM8 6H6V7H8V9H9V7H11V6H9V4H8V6ZM6 11H11V12H6V11Z"></path></svg>'},96855:k=>{k.exports='<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7.54883 10.0781C8.00911 10.2604 8.42839 10.502 8.80664 10.8027C9.1849 11.1035 9.50846 11.4521 9.77734 11.8486C10.0462 12.2451 10.2536 12.6712 10.3994 13.127C10.5452 13.5827 10.6204 14.0612 10.625 14.5625V15H9.75V14.5625C9.75 14.0202 9.64746 13.5098 9.44238 13.0312C9.2373 12.5527 8.95475 12.1357 8.59473 11.7803C8.2347 11.4248 7.81771 11.1445 7.34375 10.9395C6.86979 10.7344 6.35938 10.6296 5.8125 10.625C5.27018 10.625 4.75977 10.7275 4.28125 10.9326C3.80273 11.1377 3.38574 11.4202 3.03027 11.7803C2.6748 12.1403 2.39453 12.5573 2.18945 13.0312C1.98438 13.5052 1.87956 14.0156 1.875 14.5625V15H1V14.5625C1 14.0658 1.07292 13.5872 1.21875 13.127C1.36458 12.6667 1.57422 12.2406 1.84766 11.8486C2.12109 11.4567 2.44466 11.1104 2.81836 10.8096C3.19206 10.5088 3.61133 10.265 4.07617 10.0781C3.87109 9.93685 3.68652 9.77279 3.52246 9.58594C3.3584 9.39909 3.2194 9.19857 3.10547 8.98438C2.99154 8.77018 2.90495 8.54232 2.8457 8.30078C2.78646 8.05924 2.75456 7.81315 2.75 7.5625C2.75 7.13867 2.82975 6.74219 2.98926 6.37305C3.14876 6.00391 3.36751 5.68034 3.64551 5.40234C3.9235 5.12435 4.24707 4.9056 4.61621 4.74609C4.98535 4.58659 5.38411 4.50456 5.8125 4.5C6.23633 4.5 6.63281 4.57975 7.00195 4.73926C7.37109 4.89876 7.69466 5.11751 7.97266 5.39551C8.25065 5.6735 8.4694 5.99707 8.62891 6.36621C8.78841 6.73535 8.87044 7.13411 8.875 7.5625C8.875 7.81315 8.84538 8.05697 8.78613 8.29395C8.72689 8.53092 8.63802 8.75879 8.51953 8.97754C8.40104 9.19629 8.26204 9.39909 8.10254 9.58594C7.94303 9.77279 7.75846 9.93685 7.54883 10.0781ZM5.8125 9.75C6.11328 9.75 6.39583 9.69303 6.66016 9.5791C6.92448 9.46517 7.15462 9.31022 7.35059 9.11426C7.54655 8.91829 7.70378 8.68587 7.82227 8.41699C7.94076 8.14811 8 7.86328 8 7.5625C8 7.26172 7.94303 6.97917 7.8291 6.71484C7.71517 6.45052 7.55794 6.22038 7.35742 6.02441C7.1569 5.82845 6.92448 5.67122 6.66016 5.55273C6.39583 5.43424 6.11328 5.375 5.8125 5.375C5.51172 5.375 5.22917 5.43197 4.96484 5.5459C4.70052 5.65983 4.4681 5.81706 4.26758 6.01758C4.06706 6.2181 3.90983 6.45052 3.7959 6.71484C3.68197 6.97917 3.625 7.26172 3.625 7.5625C3.625 7.86328 3.68197 8.14583 3.7959 8.41016C3.90983 8.67448 4.06478 8.9069 4.26074 9.10742C4.45671 9.30794 4.68913 9.46517 4.95801 9.5791C5.22689 9.69303 5.51172 9.75 5.8125 9.75ZM15 1V8H13.25L10.625 10.625V8H9.75V7.125H11.5V8.5127L12.8877 7.125H14.125V1.875H5.375V3.44727C5.22917 3.46549 5.08333 3.48828 4.9375 3.51562C4.79167 3.54297 4.64583 3.58398 4.5 3.63867V1H15Z" fill="#C5C5C5"></path></svg>'},15493:k=>{k.exports='<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9.12 4.37333L8.58667 1.97333H7.41333L6.88 4.37333L6.18667 4.69333L4.21333 3.41333L3.30667 4.21333L4.58667 6.18667L4.42667 6.88L2.02667 7.41333V8.58667L4.42667 9.12L4.69333 9.92L3.41333 11.8933L4.21333 12.6933L6.18667 11.4133L6.98667 11.68L7.41333 13.9733H8.58667L9.12 11.5733L9.92 11.3067L11.8933 12.5867L12.6933 11.7867L11.4133 9.81333L11.68 9.01333L14.0267 8.58667V7.41333L11.6267 6.88L11.3067 6.08L12.5867 4.10667L11.7867 3.30667L9.81333 4.58667L9.12 4.37333ZM9.38667 1.01333L9.92 3.41333L12 2.08L14.0267 4.10667L12.5867 6.18667L14.9867 6.61333V9.38667L12.5867 9.92L14.0267 12L12 13.9733L9.92 12.5867L9.38667 14.9867H6.61333L6.08 12.5867L4 13.92L2.02667 11.8933L3.41333 9.81333L1.01333 9.38667V6.61333L3.41333 6.08L2.08 4L4.10667 1.97333L6.18667 3.41333L6.61333 1.01333H9.38667ZM10.0267 8C10.0267 8.53333 9.81333 8.99556 9.38667 9.38667C8.99556 9.77778 8.53333 9.97333 8 9.97333C7.46667 9.97333 7.00444 9.77778 6.61333 9.38667C6.22222 8.99556 6.02667 8.53333 6.02667 8C6.02667 7.46667 6.22222 7.00444 6.61333 6.61333C7.00444 6.18667 7.46667 5.97333 8 5.97333C8.53333 5.97333 8.99556 6.18667 9.38667 6.61333C9.81333 7.00444 10.0267 7.46667 10.0267 8ZM8 9.01333C8.28444 9.01333 8.51556 8.92444 8.69333 8.74667C8.90667 8.53333 9.01333 8.28444 9.01333 8C9.01333 7.71556 8.90667 7.48444 8.69333 7.30667C8.51556 7.09333 8.28444 6.98667 8 6.98667C7.71556 6.98667 7.46667 7.09333 7.25333 7.30667C7.07556 7.48444 6.98667 7.71556 6.98667 8C6.98667 8.28444 7.07556 8.53333 7.25333 8.74667C7.46667 8.92444 7.71556 9.01333 8 9.01333Z" fill="#CCCCCC"></path></svg>'},61779:k=>{k.exports='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M17.28 7.78a.75.75 0 00-1.06-1.06l-9.5 9.5a.75.75 0 101.06 1.06l9.5-9.5z"></path><path fill-rule="evenodd" d="M12 1C5.925 1 1 5.925 1 12s4.925 11 11 11 11-4.925 11-11S18.075 1 12 1zM2.5 12a9.5 9.5 0 1119 0 9.5 9.5 0 01-19 0z"></path></svg>'},70596:k=>{k.exports='<svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path d="M5.39804 10.8069C5.57428 10.9312 5.78476 10.9977 6.00043 10.9973C6.21633 10.9975 6.42686 10.93 6.60243 10.8043C6.77993 10.6739 6.91464 10.4936 6.98943 10.2863L7.43643 8.91335C7.55086 8.56906 7.74391 8.25615 8.00028 7.99943C8.25665 7.74272 8.56929 7.54924 8.91343 7.43435L10.3044 6.98335C10.4564 6.92899 10.5936 6.84019 10.7055 6.7239C10.8174 6.60762 10.9008 6.467 10.9492 6.31308C10.9977 6.15916 11.0098 5.99611 10.9847 5.83672C10.9596 5.67732 10.8979 5.52591 10.8044 5.39435C10.6703 5.20842 10.4794 5.07118 10.2604 5.00335L8.88543 4.55635C8.54091 4.44212 8.22777 4.24915 7.97087 3.99277C7.71396 3.73638 7.52035 3.42363 7.40543 3.07935L6.95343 1.69135C6.88113 1.48904 6.74761 1.31428 6.57143 1.19135C6.43877 1.09762 6.28607 1.03614 6.12548 1.01179C5.96489 0.987448 5.80083 1.00091 5.64636 1.05111C5.49188 1.1013 5.35125 1.18685 5.23564 1.30095C5.12004 1.41505 5.03265 1.55454 4.98043 1.70835L4.52343 3.10835C4.40884 3.44317 4.21967 3.74758 3.97022 3.9986C3.72076 4.24962 3.41753 4.44067 3.08343 4.55735L1.69243 5.00535C1.54065 5.05974 1.40352 5.14852 1.29177 5.26474C1.18001 5.38095 1.09666 5.52145 1.04824 5.67523C0.999819 5.82902 0.987639 5.99192 1.01265 6.1512C1.03767 6.31048 1.0992 6.46181 1.19243 6.59335C1.32027 6.7728 1.50105 6.90777 1.70943 6.97935L3.08343 7.42435C3.52354 7.57083 3.90999 7.84518 4.19343 8.21235C4.35585 8.42298 4.4813 8.65968 4.56443 8.91235L5.01643 10.3033C5.08846 10.5066 5.22179 10.6826 5.39804 10.8069ZM5.48343 3.39235L6.01043 2.01535L6.44943 3.39235C6.61312 3.8855 6.88991 4.33351 7.25767 4.70058C7.62544 5.06765 8.07397 5.34359 8.56743 5.50635L9.97343 6.03535L8.59143 6.48335C8.09866 6.64764 7.65095 6.92451 7.28382 7.29198C6.9167 7.65945 6.64026 8.10742 6.47643 8.60035L5.95343 9.97835L5.50443 8.59935C5.34335 8.10608 5.06943 7.65718 4.70443 7.28835C4.3356 6.92031 3.88653 6.64272 3.39243 6.47735L2.01443 5.95535L3.40043 5.50535C3.88672 5.33672 4.32775 5.05855 4.68943 4.69235C5.04901 4.32464 5.32049 3.88016 5.48343 3.39235ZM11.5353 14.8494C11.6713 14.9456 11.8337 14.9973 12.0003 14.9974C12.1654 14.9974 12.3264 14.9464 12.4613 14.8514C12.6008 14.7529 12.7058 14.6129 12.7613 14.4514L13.0093 13.6894C13.0625 13.5309 13.1515 13.3869 13.2693 13.2684C13.3867 13.1498 13.5307 13.0611 13.6893 13.0094L14.4613 12.7574C14.619 12.7029 14.7557 12.6004 14.8523 12.4644C14.9257 12.3614 14.9736 12.2424 14.9921 12.1173C15.0106 11.9922 14.9992 11.8645 14.9588 11.7447C14.9184 11.6249 14.8501 11.5163 14.7597 11.428C14.6692 11.3396 14.5591 11.2739 14.4383 11.2364L13.6743 10.9874C13.5162 10.9348 13.3724 10.8462 13.2544 10.7285C13.1364 10.6109 13.0473 10.4674 12.9943 10.3094L12.7423 9.53638C12.6886 9.37853 12.586 9.24191 12.4493 9.14638C12.3473 9.07343 12.2295 9.02549 12.1056 9.00642C11.9816 8.98736 11.8549 8.99772 11.7357 9.03665C11.6164 9.07558 11.508 9.142 11.4192 9.23054C11.3304 9.31909 11.2636 9.42727 11.2243 9.54638L10.9773 10.3084C10.925 10.466 10.8375 10.6097 10.7213 10.7284C10.6066 10.8449 10.4667 10.9335 10.3123 10.9874L9.53931 11.2394C9.38025 11.2933 9.2422 11.3959 9.1447 11.5326C9.04721 11.6694 8.99522 11.8333 8.99611 12.0013C8.99699 12.1692 9.0507 12.3326 9.14963 12.4683C9.24856 12.604 9.38769 12.7051 9.54731 12.7574L10.3103 13.0044C10.4692 13.0578 10.6136 13.1471 10.7323 13.2654C10.8505 13.3836 10.939 13.5283 10.9903 13.6874L11.2433 14.4614C11.2981 14.6178 11.4001 14.7534 11.5353 14.8494ZM10.6223 12.0564L10.4433 11.9974L10.6273 11.9334C10.9291 11.8284 11.2027 11.6556 11.4273 11.4284C11.6537 11.1994 11.8248 10.9216 11.9273 10.6164L11.9853 10.4384L12.0443 10.6194C12.1463 10.9261 12.3185 11.2047 12.5471 11.4332C12.7757 11.6617 13.0545 11.8336 13.3613 11.9354L13.5563 11.9984L13.3763 12.0574C13.0689 12.1596 12.7898 12.3322 12.5611 12.5616C12.3324 12.791 12.1606 13.0707 12.0593 13.3784L12.0003 13.5594L11.9423 13.3784C11.8409 13.0702 11.6687 12.7901 11.4394 12.5605C11.2102 12.3309 10.9303 12.1583 10.6223 12.0564Z"></path></svg>'},33027:k=>{k.exports='<svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path d="M6 6h4v4H6z"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M8.6 1c1.6.1 3.1.9 4.2 2 1.3 1.4 2 3.1 2 5.1 0 1.6-.6 3.1-1.6 4.4-1 1.2-2.4 2.1-4 2.4-1.6.3-3.2.1-4.6-.7-1.4-.8-2.5-2-3.1-3.5C.9 9.2.8 7.5 1.3 6c.5-1.6 1.4-2.9 2.8-3.8C5.4 1.3 7 .9 8.6 1zm.5 12.9c1.3-.3 2.5-1 3.4-2.1.8-1.1 1.3-2.4 1.2-3.8 0-1.6-.6-3.2-1.7-4.3-1-1-2.2-1.6-3.6-1.7-1.3-.1-2.7.2-3.8 1-1.1.8-1.9 1.9-2.3 3.3-.4 1.3-.4 2.7.2 4 .6 1.3 1.5 2.3 2.7 3 1.2.7 2.6.9 3.9.6z"></path></svg>'},17411:k=>{k.exports='<svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path fill-rule="evenodd" clip-rule="evenodd" d="M2.006 8.267L.78 9.5 0 8.73l2.09-2.07.76.01 2.09 2.12-.76.76-1.167-1.18a5 5 0 0 0 9.4 1.983l.813.597a6 6 0 0 1-11.22-2.683zm10.99-.466L11.76 6.55l-.76.76 2.09 2.11.76.01 2.09-2.07-.75-.76-1.194 1.18a6 6 0 0 0-11.11-2.92l.81.594a5 5 0 0 1 9.3 2.346z"></path></svg>'},65013:k=>{k.exports='<svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path fill-rule="evenodd" clip-rule="evenodd" d="M3.57 6.699l5.693-4.936L8.585 1 3.273 5.596l-1.51-1.832L1 4.442l1.85 2.214.72.043zM15 5H6.824l2.307-2H15v2zM6 7h9v2H6V7zm9 4H6v2h9v-2z"></path></svg>'},2481:k=>{k.exports='<svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path fill-rule="evenodd" clip-rule="evenodd" d="M14 5H2V3h12v2zm0 4H2V7h12v2zM2 13h12v-2H2v2z"></path></svg>'}},si={};function ee(k){var _=si[k];if(_!==void 0)return _.exports;var U=si[k]={id:k,exports:{}};return Vl[k].call(U.exports,U,U.exports,ee),U.exports}i(ee,"__webpack_require__"),ee.n=k=>{var _=k&&k.__esModule?()=>k.default:()=>k;return ee.d(_,{a:_}),_},ee.d=(k,_)=>{for(var U in _)ee.o(_,U)&&!ee.o(k,U)&&Object.defineProperty(k,U,{enumerable:!0,get:_[U]})},ee.o=(k,_)=>Object.prototype.hasOwnProperty.call(k,_),ee.nc=void 0;var lc={};(()=>{"use strict";var Ut;var k=ee(85072),_=ee.n(k),U=ee(97825),Y=ee.n(U),V=ee(77659),T=ee.n(V),g=ee(55056),h=ee.n(g),D=ee(10540),I=ee.n(D),$=ee(41113),F=ee.n($),J=ee(2410),G={};G.styleTagTransform=F(),G.setAttributes=h(),G.insert=T().bind(null,"head"),G.domAPI=Y(),G.insertStyleElement=I();var De=_()(J.A,G);const Ve=J.A&&J.A.locals?J.A.locals:void 0;var me=ee(3554),Ae={};Ae.styleTagTransform=F(),Ae.setAttributes=h(),Ae.insert=T().bind(null,"head"),Ae.domAPI=Y(),Ae.insertStyleElement=I();var nt=_()(me.A,Ae);const W=me.A&&me.A.locals?me.A.locals:void 0;var N=ee(17334),l=ee(96540),ie=ee(40961),Q=(o=>(o[o.Committed=0]="Committed",o[o.Mentioned=1]="Mentioned",o[o.Subscribed=2]="Subscribed",o[o.Commented=3]="Commented",o[o.Reviewed=4]="Reviewed",o[o.NewCommitsSinceReview=5]="NewCommitsSinceReview",o[o.Labeled=6]="Labeled",o[o.Milestoned=7]="Milestoned",o[o.Assigned=8]="Assigned",o[o.Unassigned=9]="Unassigned",o[o.HeadRefDeleted=10]="HeadRefDeleted",o[o.Merged=11]="Merged",o[o.CrossReferenced=12]="CrossReferenced",o[o.Closed=13]="Closed",o[o.Reopened=14]="Reopened",o[o.CopilotStarted=15]="CopilotStarted",o[o.CopilotFinished=16]="CopilotFinished",o[o.CopilotFinishedError=17]="CopilotFinishedError",o[o.Other=18]="Other",o))(Q||{}),Z=Object.defineProperty,O=i((o,a,u)=>a in o?Z(o,a,{enumerable:!0,configurable:!0,writable:!0,value:u}):o[a]=u,"__defNormalProp"),H=i((o,a,u)=>O(o,typeof a!="symbol"?a+"":a,u),"__publicField");const re=acquireVsCodeApi(),dt=class dt{constructor(a){H(this,"_commandHandler"),H(this,"lastSentReq"),H(this,"pendingReplies"),this._commandHandler=a,this.lastSentReq=0,this.pendingReplies=Object.create(null),window.addEventListener("message",this.handleMessage.bind(this))}registerCommandHandler(a){this._commandHandler=a}async postMessage(a){const u=String(++this.lastSentReq);return new Promise((c,f)=>{this.pendingReplies[u]={resolve:c,reject:f},a=Object.assign(a,{req:u}),re.postMessage(a)})}handleMessage(a){const u=a.data;if(u.seq){const c=this.pendingReplies[u.seq];if(c){u.err?c.reject(u.err):c.resolve(u.res);return}}this._commandHandler&&this._commandHandler(u.res)}};i(dt,"MessageHandler");let X=dt;function ue(o){return new X(o)}i(ue,"getMessageHandler");function he(){return re.getState()}i(he,"getState");function ve(o){const a=he();a&&a.number&&a.number===(o==null?void 0:o.number)&&(o.pendingCommentText=a.pendingCommentText),o&&re.setState(o)}i(ve,"setState");function Ce(o){const a=re.getState();re.setState(Object.assign(a,o))}i(Ce,"updateState");var He=Object.defineProperty,ze=i((o,a,u)=>a in o?He(o,a,{enumerable:!0,configurable:!0,writable:!0,value:u}):o[a]=u,"context_defNormalProp"),oe=i((o,a,u)=>ze(o,typeof a!="symbol"?a+"":a,u),"context_publicField");const Qe=(Ut=class{constructor(a=he(),u=null,c=null){this.pr=a,this.onchange=u,this._handler=c,oe(this,"setTitle",async f=>{const p=await this.postMessage({command:"pr.edit-title",args:{text:f}});this.updatePR({titleHTML:p.titleHTML})}),oe(this,"setDescription",f=>this.postMessage({command:"pr.edit-description",args:{text:f}})),oe(this,"checkout",()=>this.postMessage({command:"pr.checkout"})),oe(this,"openChanges",f=>this.postMessage({command:"pr.open-changes",args:{openToTheSide:f}})),oe(this,"copyPrLink",()=>this.postMessage({command:"pr.copy-prlink"})),oe(this,"copyVscodeDevLink",()=>this.postMessage({command:"pr.copy-vscodedevlink"})),oe(this,"cancelCodingAgent",f=>this.postMessage({command:"pr.cancel-coding-agent",args:f})),oe(this,"exitReviewMode",async()=>{if(this.pr)return this.postMessage({command:"pr.checkout-default-branch",args:this.pr.repositoryDefaultBranch})}),oe(this,"gotoChangesSinceReview",()=>this.postMessage({command:"pr.gotoChangesSinceReview"})),oe(this,"refresh",async()=>{this.pr&&(this.pr.busy=!0),this.updatePR(this.pr),await this.postMessage({command:"pr.refresh"}),this.pr&&(this.pr.busy=!1),this.updatePR(this.pr)}),oe(this,"checkMergeability",()=>this.postMessage({command:"pr.checkMergeability"})),oe(this,"changeEmail",async f=>{const p=await this.postMessage({command:"pr.change-email",args:f});this.updatePR({emailForCommit:p})}),oe(this,"merge",async f=>await this.postMessage({command:"pr.merge",args:f})),oe(this,"openOnGitHub",()=>this.postMessage({command:"pr.openOnGitHub"})),oe(this,"deleteBranch",()=>this.postMessage({command:"pr.deleteBranch"})),oe(this,"revert",async()=>{this.updatePR({busy:!0});const f=await this.postMessage({command:"pr.revert"});this.updatePR({busy:!1,...f})}),oe(this,"readyForReview",()=>this.postMessage({command:"pr.readyForReview"})),oe(this,"addReviewers",()=>this.postMessage({command:"pr.change-reviewers"})),oe(this,"changeProjects",()=>this.postMessage({command:"pr.change-projects"})),oe(this,"removeProject",f=>this.postMessage({command:"pr.remove-project",args:f})),oe(this,"addMilestone",()=>this.postMessage({command:"pr.add-milestone"})),oe(this,"removeMilestone",()=>this.postMessage({command:"pr.remove-milestone"})),oe(this,"addAssignees",()=>this.postMessage({command:"pr.change-assignees"})),oe(this,"addAssigneeYourself",()=>this.postMessage({command:"pr.add-assignee-yourself"})),oe(this,"addAssigneeCopilot",()=>this.postMessage({command:"pr.add-assignee-copilot"})),oe(this,"addLabels",()=>this.postMessage({command:"pr.add-labels"})),oe(this,"create",()=>this.postMessage({command:"pr.open-create"})),oe(this,"deleteComment",async f=>{await this.postMessage({command:"pr.delete-comment",args:f});const{pr:p}=this;if(!p)throw new Error("Unexpectedly no pull request when trying to delete comment");const{id:y,pullRequestReviewId:C}=f;if(!C){this.updatePR({events:p.events.filter(j=>j.id!==y)});return}const E=p.events.findIndex(j=>j.id===C);if(E===-1){console.error("Could not find review:",C);return}const R=p.events[E];if(!R.comments){console.error("No comments to delete for review:",C,R);return}p.events.splice(E,1,{...R,comments:R.comments.filter(j=>j.id!==y)}),this.updatePR(p)}),oe(this,"editComment",f=>this.postMessage({command:"pr.edit-comment",args:f})),oe(this,"updateDraft",(f,p)=>{const C=he().pendingCommentDrafts||Object.create(null);p!==C[f]&&(C[f]=p,this.updatePR({pendingCommentDrafts:C}))}),oe(this,"requestChanges",f=>this.submitReviewCommand("pr.request-changes",f)),oe(this,"approve",f=>this.submitReviewCommand("pr.approve",f)),oe(this,"submit",f=>this.submitReviewCommand("pr.submit",f)),oe(this,"close",async f=>{const{pr:p}=this;if(!p)throw new Error("Unexpectedly no pull request when trying to close");try{const y=await this.postMessage({command:"pr.close",args:f});let C=[...p.events];y.commentEvent&&C.push(y.commentEvent),y.closeEvent&&C.push(y.closeEvent),this.updatePR({events:C,pendingCommentText:"",state:y.state})}catch{}}),oe(this,"removeLabel",async f=>{const{pr:p}=this;if(!p)throw new Error("Unexpectedly no pull request when trying to remove label");await this.postMessage({command:"pr.remove-label",args:f});const y=p.labels.filter(C=>C.name!==f);this.updatePR({labels:y})}),oe(this,"applyPatch",async f=>{this.postMessage({command:"pr.apply-patch",args:{comment:f}})}),oe(this,"reRequestReview",async f=>{const{pr:p}=this;if(!p)throw new Error("Unexpectedly no pull request when trying to re-request review");const{reviewers:y}=await this.postMessage({command:"pr.re-request-review",args:f});p.reviewers=y,this.updatePR(p)}),oe(this,"updateBranch",async()=>{var f,p;const{pr:y}=this;if(!y)throw new Error("Unexpectedly no pull request when trying to update branch");const C=await this.postMessage({command:"pr.update-branch"});y.events=(f=C.events)!=null?f:y.events,y.mergeable=(p=C.mergeable)!=null?p:y.mergeable,this.updatePR(y)}),oe(this,"dequeue",async()=>{const{pr:f}=this;if(!f)throw new Error("Unexpectedly no pull request when trying to dequeue");await this.postMessage({command:"pr.dequeue"})&&(f.mergeQueueEntry=void 0),this.updatePR(f)}),oe(this,"enqueue",async()=>{const{pr:f}=this;if(!f)throw new Error("Unexpectedly no pull request when trying to enqueue");const p=await this.postMessage({command:"pr.enqueue"});p.mergeQueueEntry&&(f.mergeQueueEntry=p.mergeQueueEntry),this.updatePR(f)}),oe(this,"openDiff",f=>this.postMessage({command:"pr.open-diff",args:{comment:f}})),oe(this,"toggleResolveComment",(f,p,y)=>{this.postMessage({command:"pr.resolve-comment-thread",args:{threadId:f,toResolve:y,thread:p}}).then(C=>{C?this.updatePR({events:C}):this.refresh()})}),oe(this,"openSessionLog",f=>this.postMessage({command:"pr.open-session-log",args:{link:f}})),oe(this,"openCommitChanges",async f=>{this.updatePR({loadingCommit:f});try{const p={commitSha:f};await this.postMessage({command:"pr.openCommitChanges",args:p})}finally{this.updatePR({loadingCommit:void 0})}}),oe(this,"setPR",f=>(this.pr=f,ve(this.pr),this.onchange&&this.onchange(this.pr),this)),oe(this,"updatePR",f=>(Ce(f),this.pr=this.pr?{...this.pr,...f}:f,this.onchange&&this.onchange(this.pr),this)),oe(this,"handleMessage",f=>{var p;switch(f.command){case"pr.clear":this.setPR(void 0);return;case"pr.initialize":return this.setPR(f.pullrequest);case"update-state":return this.updatePR({state:f.state});case"pr.update-checkout-status":return this.updatePR({isCurrentlyCheckedOut:f.isCurrentlyCheckedOut});case"pr.deleteBranch":const y={};return f.branchTypes&&f.branchTypes.map(E=>{E==="local"?y.isLocalHeadDeleted=!0:(E==="remote"||E==="upstream")&&(y.isRemoteHeadDeleted=!0)}),this.updatePR(y);case"pr.enable-exit":return this.updatePR({isCurrentlyCheckedOut:!0});case"set-scroll":window.scrollTo(f.scrollPosition.x,f.scrollPosition.y);return;case"pr.scrollToPendingReview":const C=(p=document.getElementById("pending-review"))!=null?p:document.getElementById("comment-textarea");C&&(C.scrollIntoView(),C.focus());return;case"pr.submitting-review":return this.updatePR({busy:!0,lastReviewType:f.lastReviewType});case"pr.append-review":return this.appendReview(f)}}),c||(this._handler=ue(this.handleMessage))}async submitReviewCommand(a,u){try{const c=await this.postMessage({command:a,args:u});return this.appendReview(c)}catch{return this.updatePR({busy:!1})}}appendReview(a){const{pr:u}=this;if(!u)throw new Error("Unexpectedly no pull request when trying to append review");const{events:c,reviewers:f,reviewedEvent:p}=a;if(u.busy=!1,!c){this.updatePR(u);return}f&&(u.reviewers=f),u.events=c.length===0?[...u.events,p]:c,p.event===Q.Reviewed&&(u.currentUserReviewState=p.state),u.pendingCommentText="",u.pendingReviewType=void 0,this.updatePR(u)}async updateAutoMerge({autoMerge:a,autoMergeMethod:u}){const{pr:c}=this;if(!c)throw new Error("Unexpectedly no pull request when trying to update auto merge");const f=await this.postMessage({command:"pr.update-automerge",args:{autoMerge:a,autoMergeMethod:u}});c.autoMerge=f.autoMerge,c.autoMergeMethod=f.autoMergeMethod,this.updatePR(c)}postMessage(a){var u,c;return(c=(u=this._handler)==null?void 0:u.postMessage(a))!=null?c:Promise.resolve(void 0)}},i(Ut,"_PRContext"),Ut);oe(Qe,"instance",new Qe);let at=Qe;const be=(0,l.createContext)(at.instance);var qe=(o=>(o[o.Query=0]="Query",o[o.All=1]="All",o[o.LocalPullRequest=2]="LocalPullRequest",o))(qe||{}),B=(o=>(o.Approve="APPROVE",o.RequestChanges="REQUEST_CHANGES",o.Comment="COMMENT",o))(B||{}),K=(o=>(o.Open="OPEN",o.Merged="MERGED",o.Closed="CLOSED",o))(K||{}),de=(o=>(o[o.Mergeable=0]="Mergeable",o[o.NotMergeable=1]="NotMergeable",o[o.Conflict=2]="Conflict",o[o.Unknown=3]="Unknown",o[o.Behind=4]="Behind",o))(de||{}),w=(o=>(o[o.AwaitingChecks=0]="AwaitingChecks",o[o.Locked=1]="Locked",o[o.Mergeable=2]="Mergeable",o[o.Queued=3]="Queued",o[o.Unmergeable=4]="Unmergeable",o))(w||{}),P=(o=>(o.User="User",o.Organization="Organization",o.Mannequin="Mannequin",o.Bot="Bot",o))(P||{});function ge(o){switch(o){case"Organization":return"Organization";case"Mannequin":return"Mannequin";case"Bot":return"Bot";default:return"User"}}i(ge,"toAccountType");function Le(o){var a;return Be(o)?o.id:(a=o.specialDisplayName)!=null?a:o.login}i(Le,"reviewerId");function ke(o){var a,u,c;return Be(o)?(u=(a=o.name)!=null?a:o.slug)!=null?u:o.id:(c=o.specialDisplayName)!=null?c:o.login}i(ke,"reviewerLabel");function Be(o){return!!o.org}i(Be,"isITeam");function bt(o){const a=o;return!!a.isAuthor&&!!a.isCommenter}i(bt,"isISuggestedReviewer");var Me=(o=>(o.Issue="Issue",o.PullRequest="PullRequest",o))(Me||{}),we=(o=>(o.Success="success",o.Failure="failure",o.Neutral="neutral",o.Pending="pending",o.Unknown="unknown",o))(we||{}),Pe=(o=>(o.Comment="comment",o.Approve="approve",o.RequestChanges="requestChanges",o))(Pe||{}),to=(o=>(o[o.None=0]="None",o[o.Available=1]="Available",o[o.ReviewedWithComments=2]="ReviewedWithComments",o[o.ReviewedWithoutComments=3]="ReviewedWithoutComments",o))(to||{});function _t(o){var a,u;const c=(a=o.submittedAt)!=null?a:o.createdAt,f=c&&Date.now()-new Date(c).getTime()<1e3*60,p=(u=o.state)!=null?u:o.event===Q.Commented?"COMMENTED":void 0;let y="";if(f)switch(p){case"APPROVED":y="Pull request approved";break;case"CHANGES_REQUESTED":y="Changes requested on pull request";break;case"COMMENTED":y="Commented on pull request";break}return y}i(_t,"ariaAnnouncementForReview");var no=ee(37007);const ai=new no.EventEmitter;function ut(o){const[a,u]=(0,l.useState)(o);return(0,l.useEffect)(()=>{a!==o&&u(o)},[o]),[a,u]}i(ut,"useStateProp");const Ee=i(({className:o="",src:a,title:u})=>l.createElement("span",{className:`icon ${o}`,title:u,dangerouslySetInnerHTML:{__html:a}}),"Icon"),Un=null,qt=l.createElement(Ee,{src:ee(61440)}),Wn=l.createElement(Ee,{src:ee(34894),className:"check"}),_r=l.createElement(Ee,{src:ee(61779),className:"skip"}),ui=l.createElement(Ee,{src:ee(30407)}),ci=l.createElement(Ee,{src:ee(10650)}),$l=l.createElement(Ee,{src:ee(2301)}),ro=l.createElement(Ee,{src:ee(72362)}),Lr=l.createElement(Ee,{src:ee(5771)}),di=l.createElement(Ee,{src:ee(37165)}),oo=l.createElement(Ee,{src:ee(46279)}),Sr=l.createElement(Ee,{src:ee(90346)}),zl=l.createElement(Ee,{src:ee(44370)}),fi=l.createElement(Ee,{src:ee(90659)}),qn=l.createElement(Ee,{src:ee(14268)}),Bl=l.createElement(Ee,{src:ee(83344)}),At=l.createElement(Ee,{src:ee(83962)}),io=l.createElement(Ee,{src:ee(15010)}),It=l.createElement(Ee,{src:ee(19443),className:"pending"}),lo=l.createElement(Ee,{src:ee(98923)}),mi=l.createElement(Ee,{src:ee(15493)}),Tt=l.createElement(Ee,{src:ee(85130),className:"close"}),pi=l.createElement(Ee,{src:ee(17411)}),hi=l.createElement(Ee,{src:ee(30340)}),jl=l.createElement(Ee,{src:ee(9649)}),Ul=l.createElement(Ee,{src:ee(92359)}),vi=l.createElement(Ee,{src:ee(34439)}),Wl=l.createElement(Ee,{src:ee(96855)}),gi=l.createElement(Ee,{src:ee(5064)}),Ea=l.createElement(Ee,{src:ee(20628)}),yi=l.createElement(Ee,{src:ee(80459)}),Zn=l.createElement(Ee,{src:ee(70596)}),Ci=l.createElement(Ee,{src:ee(33027)}),wi=l.createElement(Ee,{src:ee(40027)}),xi=l.createElement(Ee,{src:ee(64674)}),Ei=l.createElement(Ee,{src:ee(12158)}),bi=l.createElement(Ee,{src:ee(2481)}),ki=l.createElement(Ee,{src:ee(65013)}),so=l.createElement(Ee,{src:ee(93492)}),ln=l.createElement(Ee,{className:"loading",src:ee(95570)}),_i=l.createElement(Ee,{className:"copilot-icon",src:ee(9336)}),Qn=l.createElement(Ee,{className:"copilot-icon",src:ee(94339)}),Tr=l.createElement(Ee,{className:"copilot-icon",src:ee(58726)});function wn(){const[o,a]=(0,l.useState)([0,0]);return(0,l.useLayoutEffect)(()=>{function u(){a([window.innerWidth,window.innerHeight])}return i(u,"updateSize"),window.addEventListener("resize",u),u(),()=>window.removeEventListener("resize",u)},[]),o}i(wn,"useWindowSize");const Kn=i(({optionsContext:o,defaultOptionLabel:a,defaultOptionValue:u,defaultAction:c,allOptions:f,optionsTitle:p,disabled:y,hasSingleAction:C,spreadable:E,isSecondary:R})=>{const[j,z]=(0,l.useState)(!1),le=i(A=>{A.target instanceof HTMLElement&&A.target.classList.contains("split-right")||z(!1)},"onHideAction");(0,l.useEffect)(()=>{const A=i(Ne=>le(Ne),"onClickOrKey");j?(document.addEventListener("click",A),document.addEventListener("keydown",A)):(document.removeEventListener("click",A),document.removeEventListener("keydown",A))},[j,z]);const ce=(0,l.useRef)();return wn(),l.createElement("div",{className:`dropdown-container${E?" spreadable":""}`,ref:ce},ce.current&&E&&ce.current.clientWidth>375&&f&&!C?f().map(({label:A,value:Ne,action:pe,optionDisabled:Ie})=>l.createElement("button",{className:"inlined-dropdown",key:Ne,title:A,disabled:Ie||y,onClick:pe,value:Ne},A)):l.createElement("div",{className:"primary-split-button"},l.createElement("button",{className:`split-left${R?" secondary":""}`,disabled:y,onClick:c,value:u(),title:typeof a()=="string"?a():p},a()),C?null:l.createElement("div",{className:`split${R?" secondary":""}${y?" disabled":""}`},l.createElement("div",{className:`separator${y?" disabled":""}`})),C?null:l.createElement("button",{className:`split-right${R?" secondary":""}`,title:p,disabled:y,"aria-expanded":j,onClick:i(A=>{A.preventDefault();const Ne=A.target.getBoundingClientRect(),pe=Ne.left,Ie=Ne.bottom;A.target.dispatchEvent(new MouseEvent("contextmenu",{bubbles:!0,clientX:pe,clientY:Ie})),A.stopPropagation()},"onClick"),onMouseDown:i(()=>z(!0),"onMouseDown"),onKeyDown:i(A=>{(A.key==="Enter"||A.key===" ")&&z(!0)},"onKeyDown"),"data-vscode-context":o()},ci)))},"contextDropdown_ContextDropdown"),rt="\xA0",Mr=i(({children:o})=>{const a=l.Children.count(o);return l.createElement(l.Fragment,{children:l.Children.map(o,(u,c)=>typeof u=="string"?`${c>0?rt:""}${u}${c<a-1&&typeof o[c+1]!="string"?rt:""}`:u)})},"Spaced");var ql=ee(57975),Li=ee(74353),Yn=ee.n(Li),Si=ee(6279),Gn=ee.n(Si),Ti=ee(53581),ao=ee.n(Ti),sn=Object.defineProperty,Mi=i((o,a,u)=>a in o?sn(o,a,{enumerable:!0,configurable:!0,writable:!0,value:u}):o[a]=u,"lifecycle_defNormalProp"),uo=i((o,a,u)=>Mi(o,typeof a!="symbol"?a+"":a,u),"lifecycle_publicField");function Zl(o){return{dispose:o}}i(Zl,"toDisposable");function Ql(o){return Zl(()=>an(o))}i(Ql,"lifecycle_combinedDisposable");function an(o){for(;o.length;){const a=o.pop();a==null||a.dispose()}}i(an,"disposeAll");function Ni(o,a){return a.push(o),o}i(Ni,"addDisposable");const Ur=class Ur{constructor(){uo(this,"_isDisposed",!1),uo(this,"_disposables",[])}dispose(){this._isDisposed||(this._isDisposed=!0,an(this._disposables),this._disposables=[])}_register(a){return this._isDisposed?a.dispose():this._disposables.push(a),a}get isDisposed(){return this._isDisposed}};i(Ur,"Disposable");let xn=Ur;var Kl=Object.defineProperty,Nr=i((o,a,u)=>a in o?Kl(o,a,{enumerable:!0,configurable:!0,writable:!0,value:u}):o[a]=u,"utils_defNormalProp"),Xe=i((o,a,u)=>Nr(o,typeof a!="symbol"?a+"":a,u),"utils_publicField");Yn().extend(Gn(),{thresholds:[{l:"s",r:44,d:"second"},{l:"m",r:89},{l:"mm",r:44,d:"minute"},{l:"h",r:89},{l:"hh",r:21,d:"hour"},{l:"d",r:35},{l:"dd",r:6,d:"day"},{l:"w",r:7},{l:"ww",r:3,d:"week"},{l:"M",r:4},{l:"MM",r:10,d:"month"},{l:"y",r:17},{l:"yy",d:"year"}]}),Yn().extend(ao()),Yn().updateLocale("en",{relativeTime:{future:"in %s",past:"%s ago",s:"seconds",m:"a minute",mm:"%d minutes",h:"an hour",hh:"%d hours",d:"a day",dd:"%d days",w:"a week",ww:"%d weeks",M:"a month",MM:"%d months",y:"a year",yy:"%d years"}});function Yl(o,a){const u=Object.create(null);return o.filter(c=>{const f=a(c);return u[f]?!1:(u[f]=!0,!0)})}i(Yl,"uniqBy");function co(...o){return(a,u=null,c)=>{const f=combinedDisposable(o.map(p=>p(y=>a.call(u,y))));return c&&c.push(f),f}}i(co,"anyEvent");function Gl(o,a){return(u,c=null,f)=>o(p=>a(p)&&u.call(c,p),null,f)}i(Gl,"filterEvent");function Xl(o){return(a,u=null,c)=>{const f=o(p=>(f.dispose(),a.call(u,p)),null,c);return f}}i(Xl,"onceEvent");function Ri(o){return/^[a-zA-Z]:\\/.test(o)}i(Ri,"isWindowsPath");function Pi(o,a,u=sep){return o===a?!0:(o.charAt(o.length-1)!==u&&(o+=u),Ri(o)&&(o=o.toLowerCase(),a=a.toLowerCase()),a.startsWith(o))}i(Pi,"isDescendant");function fo(o,a){return o.reduce((u,c)=>{const f=a(c);return u[f]=[...u[f]||[],c],u},Object.create(null))}i(fo,"groupBy");const Wr=class Wr extends Error{constructor(a){super(`Unreachable case: ${a}`)}};i(Wr,"UnreachableCaseError");let Xn=Wr;function Oi(o){return!!o.errors}i(Oi,"isHookError");function mo(o){let a=!0;if(o.errors&&Array.isArray(o.errors)){for(const u of o.errors)if(!u.field||!u.value||!u.status){a=!1;break}}else a=!1;return a}i(mo,"hasFieldErrors");function zt(o){if(!(o instanceof Error))return typeof o=="string"?o:o.gitErrorCode?`${o.message}. Please check git output for more details`:o.stderr?`${o.stderr}. Please check git output for more details`:"Error";let a=o.message,u;if(o.message==="Validation Failed"&&mo(o))u=o.errors.map(c=>`Value "${c.value}" cannot be set for field ${c.field} (code: ${c.status})`).join(", ");else{if(o.message.startsWith("Validation Failed:"))return o.message;if(Oi(o)&&o.errors)return o.errors.map(c=>typeof c=="string"?c:c.message).join(", ")}return u&&(a=`${a}: ${u}`),a}i(zt,"formatError");async function un(o){return new Promise(a=>{const u=o(c=>{u.dispose(),a(c)})})}i(un,"asPromise");async function cn(o,a){return Promise.race([o,new Promise(u=>{setTimeout(()=>u(void 0),a)})])}i(cn,"promiseWithTimeout");function Mt(o){const a=Yn()(o),u=Date.now();return a.diff(u,"month"),a.diff(u,"month")<1?a.fromNow():a.diff(u,"year")<1?`on ${a.format("MMM D")}`:`on ${a.format("MMM D, YYYY")}`}i(Mt,"dateFromNow");function Ht(o,a,u=!1){o.startsWith("#")&&(o=o.substring(1));const c=bn(o);if(a){const f=po(c.r,c.g,c.b),p=.6,y=.18,C=.3,E=(c.r*.2126+c.g*.7152+c.b*.0722)/255,R=Math.max(0,Math.min((E-p)*-1e3,1)),j=(p-E)*100*R,z=bn(Di(f.h,f.s,f.l+j)),le=`#${Di(f.h,f.s,f.l+j)}`,ce=u?`#${En({...c,a:y})}`:`rgba(${c.r},${c.g},${c.b},${y})`,A=u?`#${En({...z,a:C})}`:`rgba(${z.r},${z.g},${z.b},${C})`;return{textColor:le,backgroundColor:ce,borderColor:A}}else return{textColor:`#${Jl(c)}`,backgroundColor:`#${o}`,borderColor:`#${o}`}}i(Ht,"utils_gitHubLabelColor");const En=i(o=>{const a=[o.r,o.g,o.b];return o.a&&a.push(Math.floor(o.a*255)),a.map(u=>u.toString(16).padStart(2,"0")).join("")},"rgbToHex");function bn(o){const a=/^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(o);return a?{r:parseInt(a[1],16),g:parseInt(a[2],16),b:parseInt(a[3],16)}:{r:0,g:0,b:0}}i(bn,"hexToRgb");function po(o,a,u){o/=255,a/=255,u/=255;let c=Math.min(o,a,u),f=Math.max(o,a,u),p=f-c,y=0,C=0,E=0;return p==0?y=0:f==o?y=(a-u)/p%6:f==a?y=(u-o)/p+2:y=(o-a)/p+4,y=Math.round(y*60),y<0&&(y+=360),E=(f+c)/2,C=p==0?0:p/(1-Math.abs(2*E-1)),C=+(C*100).toFixed(1),E=+(E*100).toFixed(1),{h:y,s:C,l:E}}i(po,"rgbToHsl");function Di(o,a,u){const c=u/100,f=a*Math.min(c,1-c)/100,p=i(y=>{const C=(y+o/30)%12,E=c-f*Math.max(Math.min(C-3,9-C,1),-1);return Math.round(255*E).toString(16).padStart(2,"0")},"f");return`${p(0)}${p(8)}${p(4)}`}i(Di,"hslToHex");function Jl(o){return(.299*o.r+.587*o.g+.114*o.b)/255>.5?"000000":"ffffff"}i(Jl,"contrastColor");var ho=(o=>(o[o.Period=46]="Period",o[o.Slash=47]="Slash",o[o.A=65]="A",o[o.Z=90]="Z",o[o.Backslash=92]="Backslash",o[o.a=97]="a",o[o.z=122]="z",o))(ho||{});function vo(o,a){return o<a?-1:o>a?1:0}i(vo,"compare");function dn(o,a,u=0,c=o.length,f=0,p=a.length){for(;u<c&&f<p;u++,f++){const E=o.charCodeAt(u),R=a.charCodeAt(f);if(E<R)return-1;if(E>R)return 1}const y=c-u,C=p-f;return y<C?-1:y>C?1:0}i(dn,"compareSubstring");function Ai(o,a){return go(o,a,0,o.length,0,a.length)}i(Ai,"compareIgnoreCase");function go(o,a,u=0,c=o.length,f=0,p=a.length){for(;u<c&&f<p;u++,f++){let E=o.charCodeAt(u),R=a.charCodeAt(f);if(E===R)continue;const j=E-R;if(!(j===32&&yo(R))&&!(j===-32&&yo(E)))return Jn(E)&&Jn(R)?j:dn(o.toLowerCase(),a.toLowerCase(),u,c,f,p)}const y=c-u,C=p-f;return y<C?-1:y>C?1:0}i(go,"compareSubstringIgnoreCase");function Jn(o){return o>=97&&o<=122}i(Jn,"isLowerAsciiLetter");function yo(o){return o>=65&&o<=90}i(yo,"isUpperAsciiLetter");const An=class An{constructor(){Xe(this,"_value",""),Xe(this,"_pos",0)}reset(a){return this._value=a,this._pos=0,this}next(){return this._pos+=1,this}hasNext(){return this._pos<this._value.length-1}cmp(a){const u=a.charCodeAt(0),c=this._value.charCodeAt(this._pos);return u-c}value(){return this._value[this._pos]}};i(An,"StringIterator");let Co=An;const qr=class qr{constructor(a=!0){this._caseSensitive=a,Xe(this,"_value"),Xe(this,"_from"),Xe(this,"_to")}reset(a){return this._value=a,this._from=0,this._to=0,this.next()}hasNext(){return this._to<this._value.length}next(){this._from=this._to;let a=!0;for(;this._to<this._value.length;this._to++)if(this._value.charCodeAt(this._to)===46)if(a)this._from++;else break;else a=!1;return this}cmp(a){return this._caseSensitive?dn(a,this._value,0,a.length,this._from,this._to):go(a,this._value,0,a.length,this._from,this._to)}value(){return this._value.substring(this._from,this._to)}};i(qr,"ConfigKeysIterator");let fn=qr;const Zo=class Zo{constructor(a=!0,u=!0){this._splitOnBackslash=a,this._caseSensitive=u,Xe(this,"_value"),Xe(this,"_from"),Xe(this,"_to")}reset(a){return this._value=a.replace(/\\$|\/$/,""),this._from=0,this._to=0,this.next()}hasNext(){return this._to<this._value.length}next(){this._from=this._to;let a=!0;for(;this._to<this._value.length;this._to++){const u=this._value.charCodeAt(this._to);if(u===47||this._splitOnBackslash&&u===92)if(a)this._from++;else break;else a=!1}return this}cmp(a){return this._caseSensitive?dn(a,this._value,0,a.length,this._from,this._to):go(a,this._value,0,a.length,this._from,this._to)}value(){return this._value.substring(this._from,this._to)}};i(Zo,"PathIterator");let er=Zo;var Ii=(o=>(o[o.Scheme=1]="Scheme",o[o.Authority=2]="Authority",o[o.Path=3]="Path",o[o.Query=4]="Query",o[o.Fragment=5]="Fragment",o))(Ii||{});const fr=class fr{constructor(a){this._ignorePathCasing=a,Xe(this,"_pathIterator"),Xe(this,"_value"),Xe(this,"_states",[]),Xe(this,"_stateIdx",0)}reset(a){return this._value=a,this._states=[],this._value.scheme&&this._states.push(1),this._value.authority&&this._states.push(2),this._value.path&&(this._pathIterator=new er(!1,!this._ignorePathCasing(a)),this._pathIterator.reset(a.path),this._pathIterator.value()&&this._states.push(3)),this._value.query&&this._states.push(4),this._value.fragment&&this._states.push(5),this._stateIdx=0,this}next(){return this._states[this._stateIdx]===3&&this._pathIterator.hasNext()?this._pathIterator.next():this._stateIdx+=1,this}hasNext(){return this._states[this._stateIdx]===3&&this._pathIterator.hasNext()||this._stateIdx<this._states.length-1}cmp(a){if(this._states[this._stateIdx]===1)return Ai(a,this._value.scheme);if(this._states[this._stateIdx]===2)return Ai(a,this._value.authority);if(this._states[this._stateIdx]===3)return this._pathIterator.cmp(a);if(this._states[this._stateIdx]===4)return vo(a,this._value.query);if(this._states[this._stateIdx]===5)return vo(a,this._value.fragment);throw new Error}value(){if(this._states[this._stateIdx]===1)return this._value.scheme;if(this._states[this._stateIdx]===2)return this._value.authority;if(this._states[this._stateIdx]===3)return this._pathIterator.value();if(this._states[this._stateIdx]===4)return this._value.query;if(this._states[this._stateIdx]===5)return this._value.fragment;throw new Error}};i(fr,"UriIterator");let Rr=fr;function Hi(o){const u=o.extensionUri.path,c=u.lastIndexOf(".");return c===-1?!1:u.substr(c+1).length>1}i(Hi,"isPreRelease");const Zr=class Zr{constructor(){Xe(this,"segment"),Xe(this,"value"),Xe(this,"key"),Xe(this,"left"),Xe(this,"mid"),Xe(this,"right")}isEmpty(){return!this.left&&!this.mid&&!this.right&&!this.value}};i(Zr,"TernarySearchTreeNode");let kn=Zr;const Gt=class Gt{constructor(a){Xe(this,"_iter"),Xe(this,"_root"),this._iter=a}static forUris(a=()=>!1){return new Gt(new Rr(a))}static forPaths(){return new Gt(new er)}static forStrings(){return new Gt(new Co)}static forConfigKeys(){return new Gt(new fn)}clear(){this._root=void 0}set(a,u){const c=this._iter.reset(a);let f;for(this._root||(this._root=new kn,this._root.segment=c.value()),f=this._root;;){const y=c.cmp(f.segment);if(y>0)f.left||(f.left=new kn,f.left.segment=c.value()),f=f.left;else if(y<0)f.right||(f.right=new kn,f.right.segment=c.value()),f=f.right;else if(c.hasNext())c.next(),f.mid||(f.mid=new kn,f.mid.segment=c.value()),f=f.mid;else break}const p=f.value;return f.value=u,f.key=a,p}get(a){var u;return(u=this._getNode(a))==null?void 0:u.value}_getNode(a){const u=this._iter.reset(a);let c=this._root;for(;c;){const f=u.cmp(c.segment);if(f>0)c=c.left;else if(f<0)c=c.right;else if(u.hasNext())u.next(),c=c.mid;else break}return c}has(a){const u=this._getNode(a);return!((u==null?void 0:u.value)===void 0&&(u==null?void 0:u.mid)===void 0)}delete(a){return this._delete(a,!1)}deleteSuperstr(a){return this._delete(a,!0)}_delete(a,u){const c=this._iter.reset(a),f=[];let p=this._root;for(;p;){const y=c.cmp(p.segment);if(y>0)f.push([1,p]),p=p.left;else if(y<0)f.push([-1,p]),p=p.right;else if(c.hasNext())c.next(),f.push([0,p]),p=p.mid;else{for(u?(p.left=void 0,p.mid=void 0,p.right=void 0):p.value=void 0;f.length>0&&p.isEmpty();){let[C,E]=f.pop();switch(C){case 1:E.left=void 0;break;case 0:E.mid=void 0;break;case-1:E.right=void 0;break}p=E}break}}}findSubstr(a){const u=this._iter.reset(a);let c=this._root,f;for(;c;){const p=u.cmp(c.segment);if(p>0)c=c.left;else if(p<0)c=c.right;else if(u.hasNext())u.next(),f=c.value||f,c=c.mid;else break}return c&&c.value||f}findSuperstr(a){const u=this._iter.reset(a);let c=this._root;for(;c;){const f=u.cmp(c.segment);if(f>0)c=c.left;else if(f<0)c=c.right;else if(u.hasNext())u.next(),c=c.mid;else return c.mid?this._entries(c.mid):void 0}}forEach(a){for(const[u,c]of this)a(c,u)}*[Symbol.iterator](){yield*this._entries(this._root)}*_entries(a){a&&(yield*this._entries(a.left),a.value&&(yield[a.key,a.value]),yield*this._entries(a.mid),yield*this._entries(a.right))}};i(Gt,"TernarySearchTree");let Pr=Gt;async function es(o,a,u){const c=[];o.replace(a,(y,...C)=>{const E=u(y,...C);return c.push(E),""});const f=await Promise.all(c);let p=0;return o.replace(a,()=>f[p++])}i(es,"stringReplaceAsync");async function Fi(o,a,u){const c=Math.ceil(o.length/a);for(let f=0;f<c;f++){const p=o.slice(f*a,(f+1)*a);await Promise.all(p.map(u))}}i(Fi,"batchPromiseAll");function ba(o){return o.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}i(ba,"escapeRegExp");const Nt=i(({date:o,href:a})=>{const[u,c]=(0,l.useState)(Mt(o)),f=typeof o=="string"?new Date(o).toLocaleString():o.toLocaleString();return(0,l.useEffect)(()=>{c(Mt(o));const y=i(()=>{const z=Date.now(),le=typeof o=="string"?new Date(o).getTime():o.getTime(),ce=(z-le)/(1e3*60);return ce<1?2e4:ce<60?2*6e4:ce<60*24?10*6e4:null},"getUpdateInterval")();if(y===null)return;let C;const E=i(()=>{document.visibilityState==="visible"&&c(Mt(o))},"updateTimeString"),R=i(()=>{C=window.setInterval(E,y)},"startInterval"),j=i(()=>{document.visibilityState==="visible"?(c(Mt(o)),C&&clearInterval(C),R()):C&&clearInterval(C)},"handleVisibilityChange");return R(),document.addEventListener("visibilitychange",j),()=>{C&&clearInterval(C),document.removeEventListener("visibilitychange",j)}},[o]),a?l.createElement("a",{href:a,className:"timestamp",title:f},u):l.createElement("div",{className:"timestamp",title:f},u)},"Timestamp"),wo=null,Ke=i(({for:o})=>l.createElement(l.Fragment,null,o.avatarUrl?l.createElement("img",{className:"avatar",src:o.avatarUrl,alt:"",role:"presentation","aria-hidden":"true"}):l.createElement(Ee,{className:"avatar-icon",src:ee(38440)})),"InnerAvatar"),it=i(({for:o,link:a=!0,substituteIcon:u})=>a?l.createElement("a",{className:"avatar-link",href:o.url,title:o.url,"aria-hidden":"true"},u!=null?u:l.createElement(Ke,{for:o})):u!=null?u:l.createElement(Ke,{for:o}),"Avatar"),vt=i(({for:o,text:a=ke(o)})=>l.createElement("a",{className:"author-link",href:o.url,"aria-label":a,title:o.url},a),"AuthorLink"),ts=i(({authorAssociation:o},a=u=>`(${u.toLowerCase()})`)=>o.toLowerCase()==="user"?a("you"):o&&o!=="NONE"?a(o):null,"association");function mn(o){var a;const{isPRDescription:u,children:c,comment:f,headerInEditMode:p}=o,{bodyHTML:y,body:C}=f,E=(a=f.id)!=null?a:-1,R=!!f.canEdit,j=!!f.canDelete,z=f.pullRequestReviewId,[le,ce]=ut(C),[A,Ne]=ut(y),{deleteComment:pe,editComment:Ie,setDescription:Ue,pr:Se}=(0,l.useContext)(be),Te=(Se==null?void 0:Se.pendingCommentDrafts)&&Se.pendingCommentDrafts[E],[Ge,ye]=(0,l.useState)(!!Te),[Ze,ft]=(0,l.useState)(!1);if(Ge)return l.cloneElement(p?l.createElement(xo,{for:f}):l.createElement(l.Fragment,null),{},[l.createElement(rs,{id:E,key:`editComment${E}`,body:Te||le,onCancel:i(()=>{Se!=null&&Se.pendingCommentDrafts&&delete Se.pendingCommentDrafts[E],ye(!1)},"onCancel"),onSave:i(async mt=>{try{const lt=u?await Ue(mt):await Ie({comment:f,text:mt});Ne(lt.bodyHTML),ce(mt)}finally{ye(!1)}},"onSave")})]);const Xt=f.event===Q.Commented||f.event===Q.Reviewed?_t(f):void 0;return l.createElement(xo,{for:f,onMouseEnter:i(()=>ft(!0),"onMouseEnter"),onMouseLeave:i(()=>ft(!1),"onMouseLeave"),onFocus:i(()=>ft(!0),"onFocus")},Xt?l.createElement("div",{role:"alert","aria-label":Xt}):null,l.createElement("div",{className:"action-bar comment-actions",style:{display:Ze?"flex":"none"}},l.createElement("button",{title:"Quote reply",className:"icon-button",onClick:i(()=>ai.emit("quoteReply",le),"onClick")},ro),R?l.createElement("button",{title:"Edit comment",className:"icon-button",onClick:i(()=>ye(!0),"onClick")},At):null,j?l.createElement("button",{title:"Delete comment",className:"icon-button",onClick:i(()=>pe({id:E,pullRequestReviewId:z}),"onClick")},oo):null),l.createElement(Eo,{comment:f,bodyHTML:A,body:le,canApplyPatch:!!(Se!=null&&Se.isCurrentlyCheckedOut),allowEmpty:!!o.allowEmpty,specialDisplayBodyPostfix:f.specialDisplayBodyPostfix}),c)}i(mn,"CommentView");function _n(o){return o.authorAssociation!==void 0}i(_n,"isReviewEvent");function tr(o){return o&&typeof o=="object"&&typeof o.body=="string"&&typeof o.diffHunk=="string"}i(tr,"isIComment");const ns={PENDING:"will review",COMMENTED:"reviewed",CHANGES_REQUESTED:"requested changes",APPROVED:"approved"},Vi=i(o=>ns[o]||"reviewed","reviewDescriptor");function xo({for:o,onFocus:a,onMouseEnter:u,onMouseLeave:c,children:f}){var p,y,C,E,R;const j=o,z=(p=j.htmlUrl)!=null?p:o.url,le=(C=tr(o)&&o.isDraft)!=null?C:_n(o)&&((y=o.state)==null?void 0:y.toLocaleUpperCase())==="PENDING",ce=(E=j.user)!=null?E:o.author,A=(R=o.createdAt)!=null?R:o.submittedAt;return l.createElement("div",{className:"comment-container comment review-comment",onFocus:a,onMouseEnter:u,onMouseLeave:c},l.createElement("div",{className:"review-comment-container"},l.createElement("h3",{className:`review-comment-header${_n(o)&&o.comments.length>0?"":" no-details"}`},l.createElement(Mr,null,l.createElement(it,{for:ce}),l.createElement(vt,{for:ce}),_n(o)?ts(o):null,A?l.createElement(l.Fragment,null,_n(o)&&o.state?Vi(o.state):"commented",rt,l.createElement(Nt,{href:z,date:A})):l.createElement("em",null,"pending"),le?l.createElement(l.Fragment,null,l.createElement("span",{className:"pending-label"},"Pending")):null)),f))}i(xo,"CommentBox");function rs({id:o,body:a,onCancel:u,onSave:c}){const{updateDraft:f}=(0,l.useContext)(be),p=(0,l.useRef)({body:a,dirty:!1}),y=(0,l.useRef)();(0,l.useEffect)(()=>{const z=setInterval(()=>{p.current.dirty&&(f(o,p.current.body),p.current.dirty=!1)},500);return()=>clearInterval(z)},[p]);const C=(0,l.useCallback)(async()=>{const{markdown:z,submitButton:le}=y.current;le.disabled=!0;try{await c(z.value)}finally{le.disabled=!1}},[y,c]),E=(0,l.useCallback)(z=>{z.preventDefault(),C()},[C]),R=(0,l.useCallback)(z=>{(z.metaKey||z.ctrlKey)&&z.key==="Enter"&&(z.preventDefault(),C())},[C]),j=(0,l.useCallback)(z=>{p.current.body=z.target.value,p.current.dirty=!0},[p]);return l.createElement("form",{ref:y,onSubmit:E},l.createElement("textarea",{name:"markdown",defaultValue:a,onKeyDown:R,onInput:j}),l.createElement("div",{className:"form-actions"},l.createElement("button",{className:"secondary",onClick:u},"Cancel"),l.createElement("button",{type:"submit",name:"submitButton"},"Save")))}i(rs,"EditComment");const Eo=i(({comment:o,bodyHTML:a,body:u,canApplyPatch:c,allowEmpty:f,specialDisplayBodyPostfix:p})=>{var y,C;if(!u&&!a)return f?null:l.createElement("div",{className:"comment-body"},l.createElement("em",null,"No description provided."));const{applyPatch:E}=(0,l.useContext)(be),R=l.createElement("div",{dangerouslySetInnerHTML:{__html:a!=null?a:""}}),z=((C=(y=u||a)==null?void 0:y.indexOf("```diff"))!=null?C:-1)>-1&&c&&o?l.createElement("button",{onClick:i(()=>E(o),"onClick")},"Apply Patch"):l.createElement(l.Fragment,null);return l.createElement("div",{className:"comment-body"},R,z,p?l.createElement("br",null):null,p?l.createElement("em",null,p):null,l.createElement(bo,{reactions:o==null?void 0:o.reactions}))},"CommentBody"),bo=i(({reactions:o})=>{if(!Array.isArray(o)||o.length===0)return null;const a=o.filter(u=>u.count>0);return a.length===0?null:l.createElement("div",{className:"comment-reactions",style:{marginTop:6}},a.map((u,c)=>{const p=u.reactors||[],y=p.slice(0,10),C=p.length>10?p.length-10:0;let E="";return y.length>0&&(C>0?E=`${_o(y)} and ${C} more reacted with ${u.label}`:E=`${_o(y)} reacted with ${u.label}`),l.createElement("div",{key:u.label+c,title:E},l.createElement("span",{className:"reaction-label"},u.label),rt,u.count>1?l.createElement("span",{className:"reaction-count"},u.count):null)}))},"CommentReactions");function $i({pendingCommentText:o,isCopilotOnMyBehalf:a,state:u,hasWritePermission:c,isIssue:f,isAuthor:p,continueOnGitHub:y,currentUserReviewState:C,lastReviewType:E,busy:R,hasReviewDraft:j}){const{updatePR:z,requestChanges:le,approve:ce,close:A,openOnGitHub:Ne,submit:pe}=(0,l.useContext)(be),[Ie,Ue]=(0,l.useState)(!1),Se=(0,l.useRef)(),Te=(0,l.useRef)();ai.addListener("quoteReply",je=>{var Lt,Kr;const Jt=je.replace(/\n/g,`
> `);z({pendingCommentText:`> ${Jt} 

`}),(Lt=Te.current)==null||Lt.scrollIntoView(),(Kr=Te.current)==null||Kr.focus()});const Ge=i(je=>{je.preventDefault();const{value:Lt}=Te.current;A(Lt)},"closeButton");let ye=E!=null?E:C==="APPROVED"?Pe.Approve:C==="CHANGES_REQUESTED"?Pe.RequestChanges:Pe.Comment;async function Ze(je){const{value:Lt}=Te.current;if(y&&je!==Pe.Comment){await Ne();return}switch(Ue(!0),je){case Pe.RequestChanges:await le(Lt);break;case Pe.Approve:await ce(Lt);break;default:await pe(Lt)}Ue(!1)}i(Ze,"submitAction");const ft=(0,l.useCallback)(je=>{(je.metaKey||je.ctrlKey)&&je.key==="Enter"&&Ze(ye)},[pe]);async function Xt(){await Ze(ye)}i(Xt,"defaultSubmitAction");const mt=p?{[Pe.Comment]:"Comment"}:y?{[Pe.Comment]:"Comment",[Pe.Approve]:"Approve on github.com",[Pe.RequestChanges]:"Request changes on github.com"}:Ft(f),lt=!(o!=null&&o.trim())&&!j,yt=!1;return l.createElement("form",{id:"comment-form",ref:Se,className:"comment-form main-comment-form"},l.createElement("textarea",{id:"comment-textarea",name:"body",ref:Te,onInput:i(({target:je})=>z({pendingCommentText:je.value}),"onInput"),onKeyDown:ft,value:o,placeholder:"Leave a comment",onClick:i(()=>{var je;!o&&a&&!((je=Te.current)!=null&&je.textContent)&&(Te.current.textContent="@copilot ",Te.current.setSelectionRange(9,9))},"onClick")}),l.createElement("div",{className:"form-actions"},c||p?l.createElement("button",{id:"close",className:"secondary",disabled:Ie||u!==K.Open,onClick:Ge,"data-command":"close"},f?"Close Issue":"Close Pull Request"):null,l.createElement(Kn,{optionsContext:i(()=>ko(mt,o,lt),"optionsContext"),defaultAction:Xt,defaultOptionLabel:i(()=>mt[ye],"defaultOptionLabel"),defaultOptionValue:i(()=>ye,"defaultOptionValue"),allOptions:i(()=>{const je=[];return mt.approve&&je.push({label:mt[Pe.Approve],value:Pe.Approve,action:i(()=>Ze(Pe.Approve),"action"),optionDisabled:yt}),mt.comment&&je.push({label:mt[Pe.Comment],value:Pe.Comment,action:i(()=>Ze(Pe.Comment),"action"),optionDisabled:lt}),mt.requestChanges&&je.push({label:mt[Pe.RequestChanges],value:Pe.RequestChanges,action:i(()=>Ze(Pe.RequestChanges),"action"),optionDisabled:lt}),je},"allOptions"),optionsTitle:"Submit pull request review",disabled:Ie||R,hasSingleAction:Object.keys(mt).length===1,spreadable:!0})))}i($i,"AddComment");function Ft(o){return o?nr:rr}i(Ft,"commentMethods");const nr={comment:"Comment"},rr={...nr,approve:"Approve",requestChanges:"Request Changes"},ko=i((o,a,u)=>{const c={preventDefaultContextMenuItems:!0,"github:reviewCommentMenu":!0};return o.approve&&(o.approve===rr.approve?c["github:reviewCommentApprove"]=!0:c["github:reviewCommentApproveOnDotCom"]=!0),o.comment&&(c["github:reviewCommentComment"]=!0,u||(c["github:reviewCommentCommentEnabled"]=!0)),o.requestChanges&&(o.requestChanges===rr.requestChanges?(c["github:reviewCommentRequestChanges"]=!0,u||(c["github:reviewRequestChangesEnabled"]=!0)):c["github:reviewCommentRequestChangesOnDotCom"]=!0),c.body=a!=null?a:"",JSON.stringify(c)},"makeCommentMenuContext"),os=i(o=>{var a,u,c;const{updatePR:f,requestChanges:p,approve:y,submit:C,openOnGitHub:E}=useContext(PullRequestContext),[R,j]=useState(!1),z=useRef();let le=(a=o.lastReviewType)!=null?a:o.currentUserReviewState==="APPROVED"?ReviewType.Approve:o.currentUserReviewState==="CHANGES_REQUESTED"?ReviewType.RequestChanges:ReviewType.Comment;async function ce(Te){const{value:Ge}=z.current;if(o.continueOnGitHub&&Te!==ReviewType.Comment){await E();return}switch(j(!0),Te){case ReviewType.RequestChanges:await p(Ge);break;case ReviewType.Approve:await y(Ge);break;default:await C(Ge)}j(!1)}i(ce,"submitAction");async function A(){await ce(le)}i(A,"defaultSubmitAction");const Ne=i(Te=>{f({pendingCommentText:Te.target.value})},"onChangeTextarea"),pe=useCallback(Te=>{(Te.metaKey||Te.ctrlKey)&&Te.key==="Enter"&&(Te.preventDefault(),A())},[ce]),Ie=o.isAuthor?{comment:"Comment"}:o.continueOnGitHub?{comment:"Comment",approve:"Approve on github.com",requestChanges:"Request changes on github.com"}:Ft(o.isIssue),Ue=!((u=o.pendingCommentText)!=null&&u.trim())&&!o.hasReviewDraft,Se=!1;return React.createElement("span",{className:"comment-form"},React.createElement("textarea",{id:"comment-textarea",name:"body",placeholder:"Leave a comment",ref:z,value:(c=o.pendingCommentText)!=null?c:"",onChange:Ne,onKeyDown:pe,disabled:R||o.busy}),React.createElement("div",{className:"comment-button"},React.createElement(ContextDropdown,{optionsContext:i(()=>ko(Ie,o.pendingCommentText,Ue),"optionsContext"),defaultAction:A,defaultOptionLabel:i(()=>Ie[le],"defaultOptionLabel"),defaultOptionValue:i(()=>le,"defaultOptionValue"),allOptions:i(()=>{const Te=[];return Ie.approve&&Te.push({label:Ie[ReviewType.Approve],value:ReviewType.Approve,action:i(()=>ce(ReviewType.Approve),"action"),optionDisabled:Se}),Ie.comment&&Te.push({label:Ie[ReviewType.Comment],value:ReviewType.Comment,action:i(()=>ce(ReviewType.Comment),"action"),optionDisabled:Ue}),Ie.requestChanges&&Te.push({label:Ie[ReviewType.RequestChanges],value:ReviewType.RequestChanges,action:i(()=>ce(ReviewType.RequestChanges),"action"),optionDisabled:Ue}),Te},"allOptions"),optionsTitle:"Submit pull request review",disabled:R||o.busy,hasSingleAction:Object.keys(Ie).length===1,spreadable:!0})))},"AddCommentSimple");function _o(o){return o.length===0?"":o.length===1?o[0]:o.length===2?`${o[0]} and ${o[1]}`:`${o.slice(0,-1).join(", ")} and ${o[o.length-1]}`}i(_o,"joinWithAnd");const Lo=["copilot-pull-request-reviewer","copilot-swe-agent","Copilot"];var Ln=(o=>(o[o.None=0]="None",o[o.Started=1]="Started",o[o.Completed=2]="Completed",o[o.Failed=3]="Failed",o))(Ln||{});function Or(o){if(!o)return 0;switch(o.event){case Q.CopilotStarted:return 1;case Q.CopilotFinished:return 2;case Q.CopilotFinishedError:return 3;default:return 0}}i(Or,"copilotEventToStatus");function So(o){for(let a=o.length-1;a>=0;a--)if(Or(o[a])!==0)return o[a]}i(So,"mostRecentCopilotEvent");function To({canEdit:o,state:a,head:u,base:c,title:f,titleHTML:p,number:y,url:C,author:E,isCurrentlyCheckedOut:R,isDraft:j,isIssue:z,repositoryDefaultBranch:le,events:ce,owner:A,repo:Ne,busy:pe,stateReason:Ie}){const[Ue,Se]=ut(f),[Te,Ge]=(0,l.useState)(!1),ye=So(ce);return l.createElement(l.Fragment,null,l.createElement(Mo,{title:Ue,titleHTML:p,number:y,url:C,inEditMode:Te,setEditMode:Ge,setCurrentTitle:Se,canEdit:o,owner:A,repo:Ne}),l.createElement(Ro,{state:a,stateReason:Ie,head:u,base:c,author:E,isIssue:z,isDraft:j,codingAgentEvent:ye}),l.createElement("div",{className:"header-actions"},l.createElement(No,{isCurrentlyCheckedOut:R,isIssue:z,repositoryDefaultBranch:le,owner:A,repo:Ne,number:y,busy:pe}),l.createElement(zi,{canEdit:o,codingAgentEvent:ye})))}i(To,"Header");function Mo({title:o,titleHTML:a,number:u,url:c,inEditMode:f,setEditMode:p,setCurrentTitle:y,canEdit:C,owner:E,repo:R}){const{setTitle:j}=(0,l.useContext)(be),z=l.createElement("form",{className:"editing-form title-editing-form",onSubmit:i(async Ne=>{Ne.preventDefault();try{const pe=Ne.target[0].value;await j(pe),y(pe)}finally{p(!1)}},"onSubmit")},l.createElement("input",{type:"text",style:{width:"100%"},defaultValue:o}),l.createElement("div",{className:"form-actions"},l.createElement("button",{type:"button",className:"secondary",onClick:i(()=>p(!1),"onClick")},"Cancel"),l.createElement("button",{type:"submit"},"Update"))),le={preventDefaultContextMenuItems:!0,owner:E,repo:R,number:u};le["github:copyMenu"]=!0;const ce=l.createElement("div",{className:"overview-title"},l.createElement("h2",null,l.createElement("span",{dangerouslySetInnerHTML:{__html:a}})," ",l.createElement("a",{href:c,title:c,"data-vscode-context":JSON.stringify(le)},"#",u)),C?l.createElement("button",{title:"Rename",onClick:p,className:"icon-button"},At):null);return f?z:ce}i(Mo,"Title");function No({isCurrentlyCheckedOut:o,isIssue:a,repositoryDefaultBranch:u,owner:c,repo:f,number:p,busy:y}){const{refresh:C}=(0,l.useContext)(be);return l.createElement("div",{className:"button-group"},l.createElement(Po,{isCurrentlyCheckedOut:o,isIssue:a,repositoryDefaultBranch:u,owner:c,repo:f,number:p}),l.createElement("button",{title:"Refresh with the latest data from GitHub",onClick:C,className:"secondary"},"Refresh"),y?l.createElement("div",{className:"spinner"},ln):null)}i(No,"ButtonGroup");function zi({canEdit:o,codingAgentEvent:a}){const{cancelCodingAgent:u,updatePR:c,openSessionLog:f}=(0,l.useContext)(be),[p,y]=(0,l.useState)(!1),C=i(async()=>{if(!a)return;y(!0);const z=await u(a);z.events.length>0&&c(z),y(!1)},"cancel"),E=a==null?void 0:a.sessionLink;if(!a||Or(a)!==Ln.Started)return null;const R={preventDefaultContextMenuItems:!0,...E};R["github:codingAgentMenu"]=!0;const j=[];return E&&j.push({label:"View Session",value:"",action:i(()=>f(E),"action")}),o&&j.unshift({label:"Cancel Coding Agent",value:"",action:C}),l.createElement(Kn,{optionsContext:i(()=>JSON.stringify(R),"optionsContext"),defaultAction:j[0].action,defaultOptionLabel:i(()=>p?l.createElement(l.Fragment,null,l.createElement("span",{className:"loading-button"},ln),j[0].label):j[0].label,"defaultOptionLabel"),defaultOptionValue:i(()=>j[0].value,"defaultOptionValue"),allOptions:i(()=>j,"allOptions"),optionsTitle:j[0].label,disabled:p,hasSingleAction:!1,spreadable:!1,isSecondary:!0})}i(zi,"CancelCodingAgentButton");function Ro({state:o,stateReason:a,isDraft:u,isIssue:c,author:f,base:p,head:y,codingAgentEvent:C}){const{text:E,color:R,icon:j}=ls(o,u,c,a),z=Or(C);let le;return z===Ln.Started?le=Tr:z===Ln.Completed?le=_i:z===Ln.Failed&&(le=Qn),l.createElement("div",{className:"subtitle"},l.createElement("div",{id:"status",className:`status-badge-${R}`},l.createElement("span",{className:"icon"},j),l.createElement("span",null,E)),l.createElement("div",{className:"author"},l.createElement(it,{for:f,substituteIcon:le}),l.createElement("div",{className:"merge-branches"},l.createElement(vt,{for:f})," ",c?null:l.createElement(l.Fragment,null,Sn(o)," into"," ",l.createElement("code",{className:"branch-tag"},p)," from ",l.createElement("code",{className:"branch-tag"},y)))))}i(Ro,"Subtitle");const Po=i(({isCurrentlyCheckedOut:o,isIssue:a,repositoryDefaultBranch:u,owner:c,repo:f,number:p})=>{const{exitReviewMode:y,checkout:C,openChanges:E}=(0,l.useContext)(be),[R,j]=(0,l.useState)(!1),z=i(async A=>{try{switch(j(!0),A){case"checkout":await C();break;case"exitReviewMode":await y();break;case"openChanges":await E();break;default:throw new Error(`Can't find action ${A}`)}}finally{j(!1)}},"onClick");if(a)return null;const le={preventDefaultContextMenuItems:!0,owner:c,repo:f,number:p};le["github:checkoutMenu"]=!0;const ce=[];return o?ce.push({label:`Checkout '${u}'`,value:"",action:i(()=>z("exitReviewMode"),"action")}):ce.push({label:"Checkout",value:"",action:i(()=>z("checkout"),"action")}),ce.push({label:"Open Changes",value:"",action:i(()=>z("openChanges"),"action")}),l.createElement(Kn,{optionsContext:i(()=>JSON.stringify(le),"optionsContext"),defaultAction:ce[0].action,defaultOptionLabel:i(()=>ce[0].label,"defaultOptionLabel"),defaultOptionValue:i(()=>ce[0].value,"defaultOptionValue"),allOptions:i(()=>ce,"allOptions"),optionsTitle:ce[0].label,disabled:R,hasSingleAction:!1,spreadable:!1})},"CheckoutButton");function ls(o,a,u,c){const f=u?xi:fi,p=u?wi:qn;if(o===K.Merged)return{text:"Merged",color:"merged",icon:Sr};if(o===K.Open)return a?{text:"Draft",color:"draft",icon:Bl}:{text:"Open",color:"open",icon:p};{let y="closed";return u&&(y=c!=="COMPLETED"?"draft":"merged"),{text:"Closed",color:y,icon:f}}}i(ls,"getStatus");function Sn(o){return o===K.Merged?"merged changes":"wants to merge changes"}i(Sn,"getActionText");function Oo(o){const{reviewer:a,state:u}=o.reviewState,{reRequestReview:c}=(0,l.useContext)(be),f=o.event?_t(o.event):void 0;return l.createElement("div",{className:"section-item reviewer"},l.createElement("div",{className:"avatar-with-author"},l.createElement(it,{for:a}),l.createElement(vt,{for:a})),l.createElement("div",{className:"reviewer-icons"},u!=="REQUESTED"&&(Be(a)||a.accountType!==P.Bot)?l.createElement("button",{className:"icon-button",title:"Re-request review",onClick:i(()=>c(o.reviewState.reviewer.id),"onClick")},pi,"\uFE0F"):null,Do[u],f?l.createElement("div",{role:"alert","aria-label":f}):null))}i(Oo,"Reviewer");const Do={REQUESTED:(0,l.cloneElement)(It,{className:"section-icon requested",title:"Awaiting requested review"}),COMMENTED:(0,l.cloneElement)($l,{className:"section-icon commented",Root:"div",title:"Left review comments"}),APPROVED:(0,l.cloneElement)(Wn,{className:"section-icon approved",title:"Approved these changes"}),CHANGES_REQUESTED:(0,l.cloneElement)(lo,{className:"section-icon changes",title:"Requested changes"})},Zt=i(({busy:o,baseHasMergeQueue:a})=>o?l.createElement("label",{htmlFor:"automerge-checkbox",className:"automerge-checkbox-label"},"Setting..."):l.createElement("label",{htmlFor:"automerge-checkbox",className:"automerge-checkbox-label"},a?"Merge when ready":"Auto-merge"),"AutoMergeLabel"),Dr=i(({updateState:o,baseHasMergeQueue:a,allowAutoMerge:u,defaultMergeMethod:c,mergeMethodsAvailability:f,autoMerge:p,isDraft:y})=>{if(!u&&!p||!f||!c)return null;const C=l.useRef(),[E,R]=l.useState(!1),j=i(()=>{var z,le;return(le=(z=C.current)==null?void 0:z.value)!=null?le:"merge"},"selectedMethod");return l.createElement("div",{className:"automerge-section"},l.createElement("div",{className:"automerge-checkbox-wrapper"},l.createElement("input",{id:"automerge-checkbox",type:"checkbox",name:"automerge",checked:p,disabled:!u||y||E,onChange:i(async()=>{R(!0),await o({autoMerge:!p,autoMergeMethod:j()}),R(!1)},"onChange")})),l.createElement(Zt,{busy:E,baseHasMergeQueue:a}),a?null:l.createElement("div",{className:"merge-select-container"},l.createElement(Ki,{ref:C,defaultMergeMethod:c,mergeMethodsAvailability:f,onChange:i(async()=>{R(!0),await o({autoMergeMethod:j()}),R(!1)},"onChange"),disabled:E})))},"AutoMerge"),or=i(({mergeQueueEntry:o})=>{const a=l.useContext(be);let u,c;switch(o.state){case w.Mergeable:case w.AwaitingChecks:case w.Queued:{c=l.createElement("span",{className:"merge-queue-pending"},"Queued to merge..."),o.position===1?u=l.createElement("span",null,"This pull request is at the head of the ",l.createElement("a",{href:o.url},"merge queue"),"."):u=l.createElement("span",null,"This pull request is in the ",l.createElement("a",{href:o.url},"merge queue"),".");break}case w.Locked:{c=l.createElement("span",{className:"merge-queue-blocked"},"Merging is blocked"),u=l.createElement("span",null,"The base branch does not allow updates");break}case w.Unmergeable:{c=l.createElement("span",{className:"merge-queue-blocked"},"Merging is blocked"),u=l.createElement("span",null,"There are conflicts with the base branch.");break}}return l.createElement("div",{className:"merge-queue-container"},l.createElement("div",{className:"merge-queue"},l.createElement("div",{className:"merge-queue-icon"}),l.createElement("div",{className:"merge-queue-title"},c),u),l.createElement("div",{className:"button-container"},l.createElement("button",{onClick:a.dequeue},"Remove from Queue")))},"QueuedToMerge");var Qt,ir=new Uint8Array(16);function pn(){if(!Qt&&(Qt=typeof crypto!="undefined"&&crypto.getRandomValues&&crypto.getRandomValues.bind(crypto)||typeof msCrypto!="undefined"&&typeof msCrypto.getRandomValues=="function"&&msCrypto.getRandomValues.bind(msCrypto),!Qt))throw new Error("crypto.getRandomValues() not supported. See https://github.com/uuidjs/uuid#getrandomvalues-not-supported");return Qt(ir)}i(pn,"rng");const Ao=/^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000)$/i;function Bt(o){return typeof o=="string"&&Ao.test(o)}i(Bt,"validate");const Bi=Bt;for(var ot=[],Io=0;Io<256;++Io)ot.push((Io+256).toString(16).substr(1));function Ho(o){var a=arguments.length>1&&arguments[1]!==void 0?arguments[1]:0,u=(ot[o[a+0]]+ot[o[a+1]]+ot[o[a+2]]+ot[o[a+3]]+"-"+ot[o[a+4]]+ot[o[a+5]]+"-"+ot[o[a+6]]+ot[o[a+7]]+"-"+ot[o[a+8]]+ot[o[a+9]]+"-"+ot[o[a+10]]+ot[o[a+11]]+ot[o[a+12]]+ot[o[a+13]]+ot[o[a+14]]+ot[o[a+15]]).toLowerCase();if(!Bi(u))throw TypeError("Stringified UUID is invalid");return u}i(Ho,"stringify");const ss=Ho;function Tn(o,a,u){o=o||{};var c=o.random||(o.rng||pn)();if(c[6]=c[6]&15|64,c[8]=c[8]&63|128,a){u=u||0;for(var f=0;f<16;++f)a[u+f]=c[f];return a}return ss(c)}i(Tn,"v4");const Kt=Tn;var Fo=(o=>(o[o.esc=27]="esc",o[o.down=40]="down",o[o.up=38]="up",o))(Fo||{});const Ar=i(({options:o,defaultOption:a,disabled:u,submitAction:c,changeAction:f})=>{const[p,y]=(0,l.useState)(a),[C,E]=(0,l.useState)(!1),R=Kt(),j=`expandOptions${R}`,z=i(()=>{E(!C)},"onClick"),le=i(Ne=>{y(Ne.target.value),E(!1);const pe=document.getElementById(`confirm-button${R}`);pe==null||pe.focus(),f&&f(Ne.target.value)},"onMethodChange"),ce=i(Ne=>{if(C){const pe=document.activeElement;switch(Ne.keyCode){case 27:E(!1);const Ie=document.getElementById(j);Ie==null||Ie.focus();break;case 40:if(!(pe!=null&&pe.id)||pe.id===j){const Ue=document.getElementById(`${R}option0`);Ue==null||Ue.focus()}else{const Ue=new RegExp(`${R}option([0-9])`),Se=pe.id.match(Ue);if(Se!=null&&Se.length){const Te=parseInt(Se[1]);if(Te<Object.entries(o).length-1){const Ge=document.getElementById(`${R}option${Te+1}`);Ge==null||Ge.focus()}}}break;case 38:if(!(pe!=null&&pe.id)||pe.id===j){const Ue=Object.entries(o).length-1,Se=document.getElementById(`${R}option${Ue}`);Se==null||Se.focus()}else{const Ue=new RegExp(`${R}option([0-9])`),Se=pe.id.match(Ue);if(Se!=null&&Se.length){const Te=parseInt(Se[1]);if(Te>0){const Ge=document.getElementById(`${R}option${Te-1}`);Ge==null||Ge.focus()}}}break}}},"onKeyDown"),A=Object.entries(o).length===1?"hidden":C?"open":"";return l.createElement("div",{className:"select-container",onKeyDown:ce},l.createElement("div",{className:"select-control"},l.createElement(ji,{dropdownId:R,className:Object.keys(o).length>1?"select-left":"",options:o,selected:p,submitAction:c,disabled:!!u}),l.createElement("div",{className:`split${u?" disabled":""}`},l.createElement("div",{className:`separator${u?" disabled":""}`})),l.createElement("button",{id:j,className:"select-right "+A,"aria-label":"Expand button options",onClick:z},ui)),l.createElement("div",{className:C?"options-select":"hidden"},Object.entries(o).map(([Ne,pe],Ie)=>l.createElement("button",{id:`${R}option${Ie}`,key:Ne,value:Ne,onClick:le},pe))))},"Dropdown");function ji({dropdownId:o,className:a,options:u,selected:c,disabled:f,submitAction:p}){const[y,C]=(0,l.useState)(!1),E=i(async R=>{R.preventDefault();try{C(!0),await p(c)}finally{C(!1)}},"onSubmit");return l.createElement("form",{onSubmit:E},l.createElement("input",{disabled:y||f,type:"submit",className:a,id:`confirm-button${o}`,value:u[c]}))}i(ji,"Confirm");const Ir=i(({pr:o,isSimple:a})=>o.state===K.Merged?l.createElement("div",{className:"branch-status-message"},l.createElement("div",{className:"branch-status-icon"},a?Sr:null)," ","Pull request successfully merged."):o.state===K.Closed?l.createElement("div",{className:"branch-status-message"},"This pull request is closed."):null,"PRStatusMessage"),Hr=i(({pr:o})=>o.state===K.Open?null:l.createElement(qi,{...o}),"DeleteOption"),kt=i(({pr:o})=>{var a;const{state:u,status:c}=o,[f,p]=(0,l.useReducer)(y=>!y,(a=c==null?void 0:c.statuses.some(y=>y.state===we.Failure))!=null?a:!1);return(0,l.useEffect)(()=>{var y;(y=c==null?void 0:c.statuses.some(C=>C.state===we.Failure))!=null&&y?f||p():f&&p()},c==null?void 0:c.statuses),u===K.Open&&(c!=null&&c.statuses.length)?l.createElement(l.Fragment,null,l.createElement("div",{className:"status-section"},l.createElement("div",{className:"status-item"},l.createElement($o,{state:c.state}),l.createElement("p",{className:"status-item-detail-text"},hs(c.statuses)),l.createElement("button",{id:"status-checks-display-button",className:"secondary small-button",onClick:p,"aria-expanded":f},f?"Hide":"Show")),f?l.createElement(ps,{statuses:c.statuses}):null)):null},"StatusChecks"),as=i(({pr:o})=>{const{state:a,reviewRequirement:u}=o;return!u||a!==K.Open?null:l.createElement(l.Fragment,null,l.createElement("div",{className:"status-section"},l.createElement("div",{className:"status-item"},l.createElement(Yi,{state:u.state}),l.createElement("p",{className:"status-item-detail-text"},Gi(u)))))},"RequiredReviewers"),us=i(({pr:o,isSimple:a})=>{if(!a||o.state!==K.Open||o.reviewers.length===0)return null;const u=[],c=new Set(o.reviewers);let f=o.events.length-1;for(;f>=0&&c.size>0;){const p=o.events[f];if(p.event===Q.Reviewed){for(const y of c)if(p.user.id===y.reviewer.id){u.push({event:p,reviewState:y}),c.delete(y);break}}f--}return l.createElement("div",{className:"section"}," ",u.map(p=>l.createElement(Oo,{key:Le(p.reviewState.reviewer),...p})))},"InlineReviewers"),Ui=i(({pr:o,isSimple:a})=>o.isIssue?null:l.createElement("div",{id:"status-checks"},l.createElement(l.Fragment,null,l.createElement(Ir,{pr:o,isSimple:a}),l.createElement(as,{pr:o}),l.createElement(kt,{pr:o}),l.createElement(us,{pr:o,isSimple:a}),l.createElement(cs,{pr:o,isSimple:a}),l.createElement(Hr,{pr:o}))),"StatusChecksSection"),cs=i(({pr:o,isSimple:a})=>{const{create:u,checkMergeability:c}=(0,l.useContext)(be);if(a&&o.state!==K.Open)return l.createElement("div",{className:"branch-status-container"},l.createElement("form",null,l.createElement("button",{type:"submit",onClick:u},"Create New Pull Request...")));if(o.state!==K.Open)return null;const{mergeable:f}=o,[p,y]=(0,l.useState)(f);return f!==p&&f!==de.Unknown&&y(f),(0,l.useEffect)(()=>{const C=setInterval(async()=>{if(p===de.Unknown){const E=await c();y(E)}},3e3);return()=>clearInterval(C)},[p]),l.createElement("div",null,l.createElement(ds,{mergeable:p,isSimple:a,canUpdateBranch:o.canUpdateBranch}),l.createElement(Vo,{mergeable:p,isSimple:a,isCurrentlyCheckedOut:o.isCurrentlyCheckedOut,canUpdateBranch:o.canUpdateBranch}),l.createElement(Wi,{pr:{...o,mergeable:p},isSimple:a}))},"MergeStatusAndActions"),ka=null,ds=i(({mergeable:o,isSimple:a,canUpdateBranch:u})=>{const{updateBranch:c}=(0,l.useContext)(be),[f,p]=(0,l.useState)(!1),y=i(()=>{p(!0),c().finally(()=>p(!1))},"onClick");let C=It,E="Checking if this branch can be merged...",R=null;return o===de.Mergeable?(C=Wn,E="This branch has no conflicts with the base branch."):o===de.Conflict?(C=Tt,E="This branch has conflicts that must be resolved.",R="Resolve conflicts"):o===de.NotMergeable?(C=Tt,E="Branch protection policy must be fulfilled before merging."):o===de.Behind&&(C=Tt,E="This branch is out-of-date with the base branch.",R="Update with merge commit"),a&&(C=null,o!==de.Conflict&&(R=null)),l.createElement("div",{className:"status-item status-section"},C,l.createElement("p",null,E),R&&u?l.createElement("div",{className:"button-container"},l.createElement("button",{className:"secondary",onClick:y,disabled:f},R)):null)},"MergeStatus"),Vo=i(({mergeable:o,isSimple:a,isCurrentlyCheckedOut:u,canUpdateBranch:c})=>{const{updateBranch:f}=(0,l.useContext)(be),[p,y]=(0,l.useState)(!1),C=i(()=>{y(!0),f().finally(()=>y(!1))},"update"),E=!u&&o===de.Conflict;return!c||E||a||o===de.Behind||o===de.Conflict||o===de.Unknown?null:l.createElement("div",{className:"status-item status-section"},qt,l.createElement("p",null,"This branch is out-of-date with the base branch."),l.createElement("button",{className:"secondary",onClick:C,disabled:p},"Update with Merge Commit"))},"OfferToUpdate"),lr=i(({isSimple:o})=>{const[a,u]=(0,l.useState)(!1),{readyForReview:c,updatePR:f}=(0,l.useContext)(be),p=(0,l.useCallback)(async()=>{try{u(!0);const y=await c();f(y)}finally{u(!1)}},[u,c,f]);return l.createElement("div",{className:"ready-for-review-container"},l.createElement("div",{className:"ready-for-review-text-wrapper"},l.createElement("div",{className:"ready-for-review-icon"},o?null:qt),l.createElement("div",null,l.createElement("div",{className:"ready-for-review-heading"},"This pull request is still a work in progress."),l.createElement("div",{className:"ready-for-review-meta"},"Draft pull requests cannot be merged."))),l.createElement("div",{className:"button-container"},l.createElement("button",{disabled:a,onClick:p},"Ready for Review")))},"ReadyForReview"),fs=i(o=>{const a=(0,l.useContext)(be),u=(0,l.useRef)(),[c,f]=(0,l.useState)(null);return o.mergeQueueMethod?l.createElement("div",null,l.createElement("div",{id:"merge-comment-form"},l.createElement("button",{onClick:i(()=>a.enqueue(),"onClick")},"Add to Merge Queue"))):c?l.createElement(Zi,{pr:o,method:c,cancel:i(()=>f(null),"cancel")}):l.createElement("div",{className:"automerge-section wrapper"},l.createElement("button",{onClick:i(()=>f(u.current.value),"onClick")},"Merge Pull Request"),rt,"using method",rt,l.createElement(Ki,{ref:u,...o}))},"Merge"),Wi=i(({pr:o,isSimple:a})=>{var u;const{hasWritePermission:c,canEdit:f,isDraft:p,mergeable:y}=o;if(p)return f?l.createElement(lr,{isSimple:a}):null;if(y===de.Mergeable&&c&&!o.mergeQueueEntry)return a?l.createElement(jt,{...o}):l.createElement(fs,{...o});if(!a&&c&&!o.mergeQueueEntry){const C=(0,l.useContext)(be);return l.createElement(Dr,{updateState:i(E=>C.updateAutoMerge(E),"updateState"),...o,baseHasMergeQueue:!!o.mergeQueueMethod,defaultMergeMethod:(u=o.autoMergeMethod)!=null?u:o.defaultMergeMethod})}else if(o.mergeQueueEntry)return l.createElement(or,{mergeQueueEntry:o.mergeQueueEntry});return null},"PrActions"),ms=i(()=>{const{openOnGitHub:o}=useContext(PullRequestContext);return React.createElement("button",{id:"merge-on-github",type:"submit",onClick:i(()=>o(),"onClick")},"Merge on github.com")},"MergeOnGitHub"),jt=i(o=>{const{merge:a,updatePR:u}=(0,l.useContext)(be);async function c(p){const y=await a({title:"",description:"",method:p});u(y)}i(c,"submitAction");const f=Object.keys(Fr).filter(p=>o.mergeMethodsAvailability[p]).reduce((p,y)=>(p[y]=Fr[y],p),{});return l.createElement(Ar,{options:f,defaultOption:o.defaultMergeMethod,submitAction:c})},"MergeSimple"),qi=i(o=>{const{deleteBranch:a}=(0,l.useContext)(be),[u,c]=(0,l.useState)(!1);return o.isRemoteHeadDeleted!==!1&&o.isLocalHeadDeleted!==!1?l.createElement("div",null):l.createElement("div",{className:"branch-status-container"},l.createElement("form",{onSubmit:i(async f=>{f.preventDefault();try{c(!0);const p=await a();p&&p.cancelled&&c(!1)}finally{c(!1)}},"onSubmit")},l.createElement("button",{disabled:u,className:"secondary",type:"submit"},"Delete Branch...")))},"DeleteBranch");function Zi({pr:o,method:a,cancel:u}){const{merge:c,updatePR:f,changeEmail:p}=(0,l.useContext)(be),[y,C]=(0,l.useState)(!1),E=o.emailForCommit;return l.createElement("div",null,l.createElement("form",{id:"merge-comment-form",onSubmit:i(async R=>{R.preventDefault();try{C(!0);const{title:j,description:z}=R.target,le=await c({title:j==null?void 0:j.value,description:z==null?void 0:z.value,method:a,email:E});f(le)}finally{C(!1)}},"onSubmit")},a==="rebase"?null:l.createElement("input",{type:"text",name:"title",defaultValue:Qi(a,o)}),a==="rebase"?null:l.createElement("textarea",{name:"description",defaultValue:Mn(a,o)}),a==="rebase"||!E?null:l.createElement("div",{className:"commit-association"},l.createElement("span",null,"Commit will be associated with ",l.createElement("button",{className:"input-box",title:"Change email","aria-label":"Change email",disabled:y,onClick:i(()=>{C(!0),p(E).finally(()=>C(!1))},"onClick")},E))),l.createElement("div",{className:"form-actions",id:a==="rebase"?"rebase-actions":""},l.createElement("button",{className:"secondary",onClick:u},"Cancel"),l.createElement("button",{disabled:y,type:"submit",id:"confirm-merge"},a==="rebase"?"Confirm ":"",Fr[a]))))}i(Zi,"ConfirmMerge");function Qi(o,a){var u,c,f,p;switch(o){case"merge":return(c=(u=a.mergeCommitMeta)==null?void 0:u.title)!=null?c:`Merge pull request #${a.number} from ${a.head}`;case"squash":return(p=(f=a.squashCommitMeta)==null?void 0:f.title)!=null?p:`${a.title} (#${a.number})`;default:return""}}i(Qi,"getDefaultTitleText");function Mn(o,a){var u,c,f,p;switch(o){case"merge":return(c=(u=a.mergeCommitMeta)==null?void 0:u.description)!=null?c:a.title;case"squash":return(p=(f=a.squashCommitMeta)==null?void 0:f.description)!=null?p:"";default:return""}}i(Mn,"getDefaultDescriptionText");const Fr={merge:"Create Merge Commit",squash:"Squash and Merge",rebase:"Rebase and Merge"},Ki=l.forwardRef(({defaultMergeMethod:o,mergeMethodsAvailability:a,onChange:u,ariaLabel:c,name:f,title:p,disabled:y},C)=>l.createElement("select",{ref:C,defaultValue:o,onChange:u,disabled:y,"aria-label":c!=null?c:"Select merge method",name:f,title:p},Object.entries(Fr).map(([E,R])=>l.createElement("option",{key:E,value:E,disabled:!a[E]},R,a[E]?null:" (not enabled)")))),ps=i(({statuses:o})=>l.createElement("div",{className:"status-scroll"},o.map(a=>l.createElement("div",{key:a.id,className:"status-check"},l.createElement("div",{className:"status-check-details"},l.createElement($o,{state:a.state}),l.createElement(it,{for:{avatarUrl:a.avatarUrl,url:a.url}}),l.createElement("span",{className:"status-check-detail-text"},a.workflowName?`${a.workflowName} / `:null,a.context,a.event?` (${a.event})`:null," ",a.description?`\u2014 ${a.description}`:null)),l.createElement("div",null,a.isRequired?l.createElement("span",{className:"label"},"Required"):null,a.targetUrl?l.createElement("a",{href:a.targetUrl,title:a.targetUrl},"Details"):null)))),"StatusCheckDetails");function hs(o){const a=fo(o,c=>{switch(c.state){case we.Success:case we.Failure:case we.Neutral:return c.state;default:return we.Pending}}),u=[];for(const c of Object.keys(a)){const f=a[c].length;let p="";switch(c){case we.Success:p="successful";break;case we.Failure:p="failed";break;case we.Neutral:p="skipped";break;default:p="pending"}const y=f>1?`${f} ${p} checks`:`${f} ${p} check`;u.push(y)}return u.join(" and ")}i(hs,"getSummaryLabel");function $o({state:o}){switch(o){case we.Neutral:return _r;case we.Success:return Wn;case we.Failure:return Tt}return It}i($o,"StateIcon");function Yi({state:o}){switch(o){case we.Pending:return lo;case we.Failure:return Tt}return Wn}i(Yi,"RequiredReviewStateIcon");function Gi(o){const a=o.approvals.length,u=o.requestedChanges.length,c=o.count;switch(o.state){case we.Failure:return`At least ${c} approving review${c>1?"s":""} is required by reviewers with write access.`;case we.Pending:return`${u} review${u>1?"s":""} requesting changes by reviewers with write access.`}return`${a} approving review${a>1?"s":""} by reviewers with write access.`}i(Gi,"getRequiredReviewSummary");function sr(o){const{displayName:a,canDelete:u,color:c}=o,f=Ht(c,o.isDarkTheme,!1);return l.createElement("div",{className:"section-item label",style:{backgroundColor:f.backgroundColor,color:f.textColor,borderColor:`${f.borderColor}`,paddingRight:u?"2px":"8px"}},a,o.children)}i(sr,"Label");function Vr(o){const{displayName:a,color:u}=o,c=gitHubLabelColor(u,o.isDarkTheme,!1);return React.createElement("li",{style:{backgroundColor:c.backgroundColor,color:c.textColor,borderColor:`${c.borderColor}`}},a,o.children)}i(Vr,"LabelCreate");function ar({id:o,title:a,hasWritePermission:u,onHeaderClick:c,children:f,iconButtonGroup:p}){return l.createElement("div",{id:o,className:"section"},l.createElement("div",{className:`section-header ${u?"clickable":""}`,onClick:u?c:void 0},l.createElement("div",{className:"section-title"},a),u?p||l.createElement("button",{className:"icon-button",title:`Add ${a}`,onClick:c},mi):null),f)}i(ar,"Section");function ur({reviewers:o,labels:a,hasWritePermission:u,isIssue:c,projectItems:f,milestone:p,assignees:y,canAssignCopilot:C}){const{addReviewers:E,addAssignees:R,addAssigneeYourself:j,addAssigneeCopilot:z,addLabels:le,removeLabel:ce,changeProjects:A,addMilestone:Ne,updatePR:pe,pr:Ie}=(0,l.useContext)(be),[Ue,Se]=(0,l.useState)(!1),Te=C&&y.every(ye=>!Lo.includes(ye.login)),Ge=i(async()=>{const ye=await A();pe({...ye})},"updateProjects");return l.createElement("div",{id:"sidebar"},!c&&l.createElement(ar,{id:"reviewers",title:"Reviewers",hasWritePermission:u,onHeaderClick:i(async()=>{const ye=await E();pe({reviewers:ye.reviewers})},"onHeaderClick")},o&&o.length?o.map(ye=>l.createElement(Oo,{key:Le(ye.reviewer),reviewState:ye})):l.createElement("div",{className:"section-placeholder"},"None yet")),l.createElement(ar,{id:"assignees",title:"Assignees",hasWritePermission:u,onHeaderClick:i(async ye=>{const Ze=ye==null?void 0:ye.target;if(Ze!=null&&Ze.closest&&Ze.closest("#assign-copilot-btn"))return;const ft=await R();pe({assignees:ft.assignees,events:ft.events})},"onHeaderClick"),iconButtonGroup:u&&l.createElement("div",{className:"icon-button-group"},Te?l.createElement("button",{id:"assign-copilot-btn",className:"icon-button",title:"Assign for Copilot to work on",disabled:Ue,onClick:i(async ye=>{ye.stopPropagation(),Se(!0);try{const Ze=await z();pe({assignees:Ze.assignees,events:Ze.events})}finally{Se(!1)}},"onClick")},Ei):null,l.createElement("button",{className:"icon-button",title:"Add Assignees"},mi))},y&&y.length?y.map((ye,Ze)=>l.createElement("div",{key:Ze,className:"section-item reviewer"},l.createElement("div",{className:"avatar-with-author"},l.createElement(it,{for:ye}),l.createElement(vt,{for:ye})))):l.createElement("div",{className:"section-placeholder"},"None yet",Ie.hasWritePermission?l.createElement(l.Fragment,null,"\u2014",l.createElement("a",{className:"assign-yourself",onClick:i(async()=>{const ye=await j();pe({assignees:ye.assignees,events:ye.events})},"onClick")},"assign yourself")):null)),l.createElement(ar,{id:"labels",title:"Labels",hasWritePermission:u,onHeaderClick:i(async()=>{const ye=await le();pe({labels:ye.added})},"onHeaderClick")},a.length?l.createElement("div",{className:"labels-list"},a.map(ye=>l.createElement(sr,{key:ye.name,...ye,canDelete:u,isDarkTheme:Ie.isDarkTheme},u?l.createElement("button",{className:"icon-button",onClick:i(()=>ce(ye.name),"onClick")},Tt,"\uFE0F"):null))):l.createElement("div",{className:"section-placeholder"},"None yet")),!Ie.isEnterprise&&l.createElement(ar,{id:"project",title:"Project",hasWritePermission:u,onHeaderClick:Ge},f?f.length>0?f.map(ye=>l.createElement(Ji,{key:ye.project.title,...ye,canDelete:u})):l.createElement("div",{className:"section-placeholder"},"None yet"):l.createElement("a",{onClick:Ge},"Sign in with more permissions to see projects")),l.createElement(ar,{id:"milestone",title:"Milestone",hasWritePermission:u,onHeaderClick:i(async()=>{const ye=await Ne();pe({milestone:ye.added})},"onHeaderClick")},p?l.createElement(Xi,{key:p.title,...p,canDelete:u}):l.createElement("div",{className:"section-placeholder"},"No milestone")))}i(ur,"Sidebar");function vs(o){const[a,u]=(0,l.useState)(!1),c=(0,l.useRef)(null);return l.createElement("div",{className:"collapsible-sidebar"},l.createElement("div",{className:`collapsible-sidebar-header ${a?"expanded":""}`,onClick:i(()=>u(f=>!f),"onClick"),tabIndex:0,role:"button","aria-expanded":a},l.createElement("span",{className:"collapsible-sidebar-title"},a?null:l.createElement(zo,{...o}))),l.createElement("div",{className:"collapsible-sidebar-content",ref:c,style:{display:a?"block":"none"}},l.createElement(ur,{...o})),l.createElement("a",{className:"collapsible-label-see-more",onClick:i(()=>u(f=>!f),"onClick")},a?"See less":"See more"))}i(vs,"CollapsibleSidebar");function zo(o){const{reviewers:a,assignees:u,labels:c,projectItems:f,milestone:p,isIssue:y}=o,[C,E]=(0,l.useState)(!1);(0,l.useEffect)(()=>{const A=i(()=>{E(window.innerWidth<=350)},"checkViewportWidth");return A(),window.addEventListener("resize",A),()=>window.removeEventListener("resize",A)},[]);const R=i(({users:A})=>l.createElement("span",{className:"avatar-stack hello",style:{width:`${Math.min(A.length,10)*10+10}px`}},A.slice(0,10).map((Ne,pe)=>l.createElement("span",{className:"stacked-avatar",style:{left:`${pe*10}px`}},l.createElement(it,{for:Ne})))),"AvatarStack"),j=i(({items:A,getKey:Ne,getColor:pe,getText:Ie})=>{const Ue=(0,l.useRef)(null),[Se,Te]=(0,l.useState)(A.length);(0,l.useEffect)(()=>{if(!Ue.current||A.length===0)return;const Ze=new ResizeObserver(()=>{const ft=Ue.current;if(!ft)return;const Xt=ft.offsetWidth,mt=60;let lt=A.length,yt=A.reduce((je,Lt)=>je+Ie(Lt).length,0);for(;lt>0&&!(yt*6+14*lt+(lt<A.length?mt:0)<=Xt);)yt-=Ie(A[lt-1]).length,lt--;Te(Math.max(1,lt))});return Ze.observe(Ue.current),()=>Ze.disconnect()},[A.length]);const Ge=A.slice(0,Se),ye=A.length-Se;return l.createElement("span",{className:"pill-container",ref:Ue},Ge.map(Ze=>{const ft=pe(Ze);return l.createElement("span",{key:Ne(Ze),className:"pill-item label",style:{backgroundColor:ft.backgroundColor,color:ft.textColor,borderRadius:"20px"},title:Ie(Ze)},Ie(Ze))}),ye>0&&l.createElement("span",{className:"pill-overflow"},"+",ye," more"))},"PillContainer"),z=[],le=a==null?void 0:a.filter(A=>!!A.reviewer.avatarUrl).map(A=>({avatarUrl:A.reviewer.avatarUrl,name:ke(A.reviewer)}));!y&&le&&le.length&&z.push({label:"Reviewers",value:l.createElement(R,{users:le}),count:le.length});const ce=u==null?void 0:u.filter(A=>!!A.avatarUrl).map(A=>({avatarUrl:A.avatarUrl,name:ke(A)}));return ce&&ce.length&&z.push({label:"Assignees",value:l.createElement(R,{users:ce}),count:ce.length}),c&&c.length&&z.push({label:"Labels",value:l.createElement(j,{items:c,getKey:i(A=>A.name,"getKey"),getColor:i(A=>Ht(A.color,o==null?void 0:o.isDarkTheme,!1),"getColor"),getText:i(A=>A.name,"getText")}),count:c.length}),f&&f.length&&z.push({label:"Project",value:l.createElement(j,{items:f,getKey:i(A=>A.project.title,"getKey"),getColor:i(()=>Ht("#ededed",o==null?void 0:o.isDarkTheme,!1),"getColor"),getText:i(A=>A.project.title,"getText")}),count:f.length}),p&&z.push({label:"Milestone",value:l.createElement(j,{items:[p],getKey:i(A=>A.title,"getKey"),getColor:i(()=>Ht("#ededed",o==null?void 0:o.isDarkTheme,!1),"getColor"),getText:i(A=>A.title,"getText")}),count:1}),z.length?l.createElement("span",{className:"collapsed-label"},z.map(A=>l.createElement("span",{className:"collapsed-section",key:A.label},l.createElement("span",{className:"collapsed-section-label"},A.label),C?l.createElement("span",{className:"collapsed-section-count"},A.count):A.value))):l.createElement("span",{className:"collapsed-label"},y?"Assignees, Labels, Project, and Milestone":"Reviewers, Assignees, Labels, Project, and Milestone")}i(zo,"CollapsedLabel");function Xi(o){const{removeMilestone:a,updatePR:u,pr:c}=(0,l.useContext)(be),f=getComputedStyle(document.documentElement).getPropertyValue("--vscode-badge-foreground"),p=Ht(f,c.isDarkTheme,!1),{canDelete:y,title:C}=o;return l.createElement("div",{className:"labels-list"},l.createElement("div",{className:"section-item label",style:{backgroundColor:p.backgroundColor,color:p.textColor,borderColor:`${p.borderColor}`}},C,y?l.createElement("button",{className:"icon-button",onClick:i(async()=>{await a(),u({milestone:void 0})},"onClick")},Tt,"\uFE0F"):null))}i(Xi,"Milestone");function Ji(o){const{removeProject:a,updatePR:u,pr:c}=(0,l.useContext)(be),f=getComputedStyle(document.documentElement).getPropertyValue("--vscode-badge-foreground"),p=Ht(f,c.isDarkTheme,!1),{canDelete:y}=o;return l.createElement("div",{className:"labels-list"},l.createElement("div",{className:"section-item label",style:{backgroundColor:p.backgroundColor,color:p.textColor,borderColor:`${p.borderColor}`}},o.project.title,y?l.createElement("button",{className:"icon-button",onClick:i(async()=>{var C;await a(o),u({projectItems:(C=c.projectItems)==null?void 0:C.filter(E=>E.id!==o.id)})},"onClick")},Tt,"\uFE0F"):null))}i(Ji,"Project");var gs=(o=>(o[o.ADD=0]="ADD",o[o.COPY=1]="COPY",o[o.DELETE=2]="DELETE",o[o.MODIFY=3]="MODIFY",o[o.RENAME=4]="RENAME",o[o.TYPE=5]="TYPE",o[o.UNKNOWN=6]="UNKNOWN",o[o.UNMERGED=7]="UNMERGED",o))(gs||{});const mr=class mr{constructor(a,u,c,f,p,y,C){this.baseCommit=a,this.status=u,this.fileName=c,this.previousFileName=f,this.patch=p,this.diffHunks=y,this.blobUrl=C}};i(mr,"file_InMemFileChange");let el=mr;const Qo=class Qo{constructor(a,u,c,f,p){this.baseCommit=a,this.blobUrl=u,this.status=c,this.fileName=f,this.previousFileName=p}};i(Qo,"file_SlimFileChange");let tl=Qo;var ys=Object.defineProperty,Cs=i((o,a,u)=>a in o?ys(o,a,{enumerable:!0,configurable:!0,writable:!0,value:u}):o[a]=u,"diffHunk_defNormalProp"),cr=i((o,a,u)=>Cs(o,typeof a!="symbol"?a+"":a,u),"diffHunk_publicField"),nl=(o=>(o[o.Context=0]="Context",o[o.Add=1]="Add",o[o.Delete=2]="Delete",o[o.Control=3]="Control",o))(nl||{});const In=class In{constructor(a,u,c,f,p,y=!0){this.type=a,this.oldLineNumber=u,this.newLineNumber=c,this.positionInHunk=f,this._raw=p,this.endwithLineBreak=y}get raw(){return this._raw}get text(){return this._raw.substr(1)}};i(In,"DiffLine");let $r=In;function Bo(o){switch(o[0]){case" ":return 0;case"+":return 1;case"-":return 2;default:return 3}}i(Bo,"getDiffChangeType");const Qr=class Qr{constructor(a,u,c,f,p){this.oldLineNumber=a,this.oldLength=u,this.newLineNumber=c,this.newLength=f,this.positionInHunk=p,cr(this,"diffLines",[])}};i(Qr,"DiffHunk");let zr=Qr;const jo=/^@@ \-(\d+)(,(\d+))?( \+(\d+)(,(\d+)?)?)? @@/;function rl(o){let a=0,u=0;for(;(u=o.indexOf("\r",u))!==-1;)u++,a++;return a}i(rl,"countCarriageReturns");function*ol(o){let a=0;for(;a!==-1&&a<o.length;){const u=a;a=o.indexOf(`
`,a);let f=(a!==-1?a:o.length)-u;a!==-1&&(a>0&&o[a-1]==="\r"&&f--,a++),yield o.substr(u,f)}}i(ol,"LineReader");function*Nn(o){const a=ol(o);let u=a.next(),c,f=-1,p=-1,y=-1;for(;!u.done;){const C=u.value;if(jo.test(C)){c&&(yield c,c=void 0),f===-1&&(f=0);const E=jo.exec(C),R=p=Number(E[1]),j=Number(E[3])||1,z=y=Number(E[5]),le=Number(E[7])||1;c=new zr(R,j,z,le,f),c.diffLines.push(new $r(3,-1,-1,f,C))}else if(c){const E=Bo(C);if(E===3)c.diffLines&&c.diffLines.length&&(c.diffLines[c.diffLines.length-1].endwithLineBreak=!1);else{c.diffLines.push(new $r(E,E!==1?p:-1,E!==2?y:-1,f,C));const R=1+rl(C);switch(E){case 0:p+=R,y+=R;break;case 2:p+=R;break;case 1:y+=R;break}}}f!==-1&&++f,u=a.next()}c&&(yield c)}i(Nn,"parseDiffHunk");function il(o){const a=Nn(o);let u=a.next();const c=[];for(;!u.done;){const f=u.value;c.push(f),u=a.next()}return c}i(il,"parsePatch");function Br(o){const a=[],u=i(E=>({diffLines:[],newLength:0,oldLength:0,oldLineNumber:E.oldLineNumber,newLineNumber:E.newLineNumber,positionInHunk:0}),"newHunk");let c,f;const p=i((E,R)=>{E.diffLines.push(R),R.type===2?E.oldLength++:R.type===1?E.newLength++:R.type===0&&(E.oldLength++,E.newLength++)},"addLineToHunk"),y=i(E=>E.diffLines.some(R=>R.type!==0),"hunkHasChanges"),C=i(E=>y(E)&&E.diffLines[E.diffLines.length-1].type===0,"hunkHasSandwichedChanges");for(const E of o.diffLines)E.type===0?(c||(c=u(E)),p(c,E),C(c)&&(f||(f=u(E)),p(f,E))):(c||o.oldLineNumber===1&&(E.type===2||E.type===1))&&(c||(c=u(E)),C(c)&&(a.push(c),c=f,f=void 0),(E.type===2||E.type===1)&&p(c,E));return c&&a.push(c),a}i(Br,"splitIntoSmallerHunks");function _a(o,a){const u=o.split(/\r?\n/),c=Nn(a);let f=c.next();const p=[],y=[];let C=0,E=!0;for(;!f.done;){const R=f.value;p.push(R);const j=R.oldLineNumber;for(let z=C+1;z<j;z++)y.push(u[z-1]);C=j+R.oldLength-1;for(let z=0;z<R.diffLines.length;z++){const le=R.diffLines[z];if(!(le.type===2||le.type===3))if(le.type===1)y.push(le.text);else{const ce=le.text;y.push(ce)}}if(f=c.next(),f.done){for(let z=R.diffLines.length-1;z>=0;z--)if(R.diffLines[z].type!==2){E=R.diffLines[z].endwithLineBreak;break}}}if(E)if(C<u.length)for(let R=C+1;R<=u.length;R++)y.push(u[R-1]);else y.push("");return y.join(`
`)}i(_a,"getModifiedContentFromDiffHunk");function ws(o){switch(o){case"removed":return GitChangeType.DELETE;case"added":return GitChangeType.ADD;case"renamed":return GitChangeType.RENAME;case"modified":return GitChangeType.MODIFY;default:return GitChangeType.UNKNOWN}}i(ws,"getGitChangeType");async function Rn(o,a){var u;const c=[];for(let f=0;f<o.length;f++){const p=o[f],y=ws(p.status);if(!p.patch&&y!==GitChangeType.RENAME&&y!==GitChangeType.MODIFY&&!(y===GitChangeType.ADD&&p.additions===0)){c.push(new SlimFileChange(a,p.blob_url,y,p.filename,p.previous_filename));continue}const C=p.patch?il(p.patch):void 0;c.push(new InMemFileChange(a,y,p.filename,p.previous_filename,(u=p.patch)!=null?u:"",C,p.blob_url))}return c}i(Rn,"parseDiff");function xs({hunks:o}){return l.createElement("div",{className:"diff"},o.map((a,u)=>l.createElement(Es,{key:u,hunk:a})))}i(xs,"Diff");const dr=xs,Es=i(({hunk:o,maxLines:a=8})=>l.createElement(l.Fragment,null,o.diffLines.slice(-a).map(u=>l.createElement("div",{key:ll(u),className:`diffLine ${Uo(u.type)}`},l.createElement(hn,{num:u.oldLineNumber}),l.createElement(hn,{num:u.newLineNumber}),l.createElement("div",{className:"diffTypeSign"},u._raw.substr(0,1)),l.createElement("div",{className:"lineContent"},u._raw.substr(1))))),"Hunk"),ll=i(o=>`${o.oldLineNumber}->${o.newLineNumber}`,"keyForDiffLine"),hn=i(({num:o})=>l.createElement("div",{className:"lineNumber"},o>0?o:" "),"LineNumber"),Uo=i(o=>nl[o].toLowerCase(),"getDiffChangeClass");function Pn(o){return o.event===Q.Assigned||o.event===Q.Unassigned}i(Pn,"isAssignUnassignEvent");const Wo=i(({events:o,isIssue:a})=>{var u,c,f,p;const y=[];for(let C=0;C<o.length;C++)if(C>0&&Pn(o[C])&&Pn(y[y.length-1])){const E=y[y.length-1],R=o[C];if(E.actor.login===R.actor.login&&new Date(E.createdAt).getTime()+1e3*60*10>new Date(R.createdAt).getTime()){const j=E.assignees||[],z=E.unassignees||[],le=(c=(u=R.assignees)==null?void 0:u.filter(A=>!j.some(Ne=>Ne.id===A.id)))!=null?c:[],ce=(p=(f=R.unassignees)==null?void 0:f.filter(A=>!z.some(Ne=>Ne.id===A.id)))!=null?p:[];E.assignees=[...j,...le],E.unassignees=[...z,...ce]}else y.push(R)}else y.push(o[C]);return l.createElement(l.Fragment,null,y.map(C=>{switch(C.event){case Q.Committed:return l.createElement(ks,{key:`commit${C.id}`,...C});case Q.Reviewed:return l.createElement(jr,{key:`review${C.id}`,...C});case Q.Commented:return l.createElement(Ns,{key:`comment${C.id}`,...C});case Q.Merged:return l.createElement(Rs,{key:`merged${C.id}`,...C});case Q.Assigned:return l.createElement(al,{key:`assign${C.id}`,event:C});case Q.Unassigned:return l.createElement(al,{key:`unassign${C.id}`,event:C});case Q.HeadRefDeleted:return l.createElement(Ps,{key:`head${C.id}`,...C});case Q.CrossReferenced:return l.createElement(Os,{key:`cross${C.id}`,...C});case Q.Closed:return l.createElement(Ds,{key:`closed${C.id}`,event:C,isIssue:a});case Q.Reopened:return l.createElement(qo,{key:`reopened${C.id}`,event:C,isIssue:a});case Q.NewCommitsSinceReview:return l.createElement(_s,{key:`newCommits${C.id}`});case Q.CopilotStarted:return l.createElement(On,{key:`copilotStarted${C.id}`,...C});case Q.CopilotFinished:return l.createElement(Ye,{key:`copilotFinished${C.id}`,...C});case Q.CopilotFinishedError:return l.createElement(Je,{key:`copilotFinishedError${C.id}`,...C});default:throw new Xn(C)}}))},"Timeline"),bs=null,ks=i(o=>{var a;const u=(0,l.useContext)(be),[c,f]=(0,l.useState)(void 0),p=i((C,E)=>{C.preventDefault(),f(E),u.openCommitChanges(o.sha).finally(()=>{f(void 0)})},"handleCommitClick"),y=((a=u.pr)==null?void 0:a.loadingCommit)===o.sha;return l.createElement("div",{className:"comment-container commit"},l.createElement("div",{className:"commit-message"},Lr,rt,l.createElement("div",{className:"avatar-container"},l.createElement(it,{for:o.author})),l.createElement("div",{className:"message-container"},l.createElement("a",{className:"message",onClick:i(C=>p(C,"title"),"onClick"),title:o.htmlUrl},o.message.substr(0,o.message.indexOf(`
`)>-1?o.message.indexOf(`
`):o.message.length)),y&&c==="title"&&l.createElement("span",{className:"commit-spinner-inline"},ln))),l.createElement("div",{className:"timeline-detail"},l.createElement("a",{className:"sha",onClick:i(C=>p(C,"sha"),"onClick"),title:o.htmlUrl},y&&c==="sha"&&l.createElement("span",{className:"commit-spinner-before"},ln),o.sha.slice(0,7)),l.createElement(Nt,{date:o.committedDate})))},"CommitEventView"),_s=i(()=>{const{gotoChangesSinceReview:o,pr:a}=(0,l.useContext)(be);if(!a.isCurrentlyCheckedOut)return null;const[u,c]=(0,l.useState)(!1),f=i(async()=>{c(!0),await o(),c(!1)},"viewChanges");return l.createElement("div",{className:"comment-container commit"},l.createElement("div",{className:"commit-message"},io,rt,l.createElement("span",{style:{fontWeight:"bold"}},"New changes since your last Review")),l.createElement("button",{"aria-live":"polite",title:"View the changes since your last review",onClick:f,disabled:u},"View Changes"))},"NewCommitsSinceReviewEventView"),Ls=i(o=>o.position!==null?`pos:${o.position}`:`ori:${o.originalPosition}`,"positionKey"),Ss=i(o=>fo(o,a=>a.path+":"+Ls(a)),"groupCommentsByPath"),jr=i(o=>{const a=Ss(o.comments),u=o.state==="PENDING";return l.createElement(mn,{comment:o,allowEmpty:!0},o.comments.length?l.createElement("div",{className:"comment-body review-comment-body"},Object.entries(a).map(([c,f])=>l.createElement(Ts,{key:c,thread:f,event:o}))):null,u?l.createElement(Ms,null):null)},"ReviewEventView");function Ts({thread:o,event:a}){var u;const c=o[0],[f,p]=(0,l.useState)(!c.isResolved),[y,C]=(0,l.useState)(!!c.isResolved),{openDiff:E,toggleResolveComment:R}=(0,l.useContext)(be),j=a.reviewThread&&(a.reviewThread.canResolve&&!a.reviewThread.isResolved||a.reviewThread.canUnresolve&&a.reviewThread.isResolved),z=i(()=>{if(a.reviewThread){const le=!y;p(!le),C(le),R(a.reviewThread.threadId,o,le)}},"toggleResolve");return l.createElement("div",{key:a.id,className:"diff-container"},l.createElement("div",{className:"resolved-container"},l.createElement("div",null,c.position===null?l.createElement("span",null,l.createElement("span",null,c.path),l.createElement("span",{className:"outdatedLabel"},"Outdated")):l.createElement("a",{className:"diffPath",onClick:i(()=>E(c),"onClick")},c.path),!y&&!f?l.createElement("span",{className:"unresolvedLabel"},"Unresolved"):null),l.createElement("button",{className:"secondary",onClick:i(()=>p(!f),"onClick")},f?"Hide":"Show")),f?l.createElement("div",null,l.createElement(dr,{hunks:(u=c.diffHunks)!=null?u:[]}),o.map(le=>l.createElement(mn,{key:le.id,comment:le})),j?l.createElement("div",{className:"resolve-comment-row"},l.createElement("button",{className:"secondary comment-resolve",onClick:i(()=>z(),"onClick")},y?"Unresolve Conversation":"Resolve Conversation")):null):null)}i(Ts,"CommentThread");function Ms(){const{requestChanges:o,approve:a,submit:u,pr:c}=(0,l.useContext)(be),f=c==null?void 0:c.isAuthor,p=(0,l.useRef)(),[y,C]=(0,l.useState)(!1),[E,R]=(0,l.useState)("");async function j(A,Ne){A.preventDefault();const pe=E;switch(C(!0),Ne){case Pe.RequestChanges:await o(pe);break;case Pe.Approve:await a(pe);break;default:await u(pe)}C(!1)}i(j,"submitAction");const z=i(A=>{(A.ctrlKey||A.metaKey)&&A.key==="Enter"&&j(A,Pe.Comment)},"onKeyDown"),le=i(A=>{R(A.target.value)},"onTextareaChange"),ce=!E.trim()&&!c.hasReviewDraft;return l.createElement("form",null,l.createElement("textarea",{id:"pending-review",ref:p,placeholder:"Leave a review summary comment",onKeyDown:z,onChange:le,value:E}),l.createElement("div",{className:"form-actions"},f?null:l.createElement("button",{id:"request-changes",className:"secondary",disabled:y||c.busy||ce,onClick:i(A=>j(A,Pe.RequestChanges),"onClick")},"Request Changes"),f?null:l.createElement("button",{id:"approve",className:"secondary",disabled:y||c.busy,onClick:i(A=>j(A,Pe.Approve),"onClick")},"Approve"),l.createElement("button",{disabled:y||c.busy||ce,onClick:i(A=>j(A,Pe.Comment),"onClick")},"Submit Review")))}i(Ms,"AddReviewSummaryComment");const Ns=i(o=>l.createElement(mn,{headerInEditMode:!0,comment:o}),"CommentEventView"),Rs=i(o=>{const{revert:a,pr:u}=(0,l.useContext)(be);return l.createElement("div",{className:"comment-container commit"},l.createElement("div",{className:"commit-message"},Sr,rt,l.createElement("div",{className:"avatar-container"},l.createElement(it,{for:o.user})),l.createElement(vt,{for:o.user}),l.createElement("div",{className:"message"},"merged commit",rt,l.createElement("a",{className:"sha",href:o.commitUrl,title:o.commitUrl},o.sha.substr(0,7)),rt,"into ",o.mergeRef,rt)),u.revertable?l.createElement("div",{className:"timeline-detail"},l.createElement("button",{className:"secondary",disabled:u.busy,onClick:a},"Revert")):null,l.createElement(Nt,{href:o.url,date:o.createdAt}))},"MergedEventView"),Ps=i(o=>l.createElement("div",{className:"comment-container commit"},l.createElement("div",{className:"commit-message"},l.createElement("div",{className:"avatar-container"},l.createElement(it,{for:o.actor})),l.createElement(vt,{for:o.actor}),l.createElement("div",{className:"message"},"deleted the ",o.headRef," branch",rt)),l.createElement(Nt,{date:o.createdAt})),"HeadDeleteEventView"),Os=i(o=>{const{source:a}=o;return l.createElement("div",{className:"comment-container commit"},l.createElement("div",{className:"commit-message"},l.createElement("div",{className:"avatar-container"},l.createElement(it,{for:o.actor})),l.createElement(vt,{for:o.actor}),l.createElement("div",{className:"message"},"linked ",l.createElement("a",{href:a.extensionUrl},"#",a.number)," ",a.title,rt,o.willCloseTarget?"which will close this issue":"")),l.createElement(Nt,{date:o.createdAt}))},"CrossReferencedEventView");function sl(o){return o.length===0?l.createElement(l.Fragment,null):o.length===1?o[0]:o.length===2?l.createElement(l.Fragment,null,o[0]," and ",o[1]):l.createElement(l.Fragment,null,o.slice(0,-1).map(a=>l.createElement(l.Fragment,null,a,", "))," and ",o[o.length-1])}i(sl,"timeline_joinWithAnd");const al=i(({event:o})=>{const{actor:a}=o,u=o.assignees||[],c=o.unassignees||[],f=sl(u.map(C=>l.createElement(vt,{key:`${C.id}a`,for:C}))),p=sl(c.map(C=>l.createElement(vt,{key:`${C.id}u`,for:C})));let y;return u.length>0&&c.length>0?y=l.createElement(l.Fragment,null,"assigned ",f," and unassigned ",p):u.length>0?y=l.createElement(l.Fragment,null,"assigned ",f):y=l.createElement(l.Fragment,null,"unassigned ",p),l.createElement("div",{className:"comment-container commit"},l.createElement("div",{className:"commit-message"},l.createElement("div",{className:"avatar-container"},l.createElement(it,{for:a})),l.createElement(vt,{for:a}),l.createElement("div",{className:"message"},y)),l.createElement(Nt,{date:o.createdAt}))},"AssignUnassignEventView"),Ds=i(({event:o,isIssue:a})=>{const{actor:u,createdAt:c}=o;return l.createElement("div",{className:"comment-container commit"},l.createElement("div",{className:"commit-message"},l.createElement("div",{className:"avatar-container"},l.createElement(it,{for:u})),l.createElement(vt,{for:u}),l.createElement("div",{className:"message"},a?"closed this issue":"closed this pull request")),l.createElement(Nt,{date:c}))},"ClosedEventView"),qo=i(({event:o,isIssue:a})=>{const{actor:u,createdAt:c}=o;return l.createElement("div",{className:"comment-container commit"},l.createElement("div",{className:"commit-message"},l.createElement("div",{className:"avatar-container"},l.createElement(it,{for:u})),l.createElement(vt,{for:u}),l.createElement("div",{className:"message"},a?"reopened this issue":"reopened this pull request")),l.createElement(Nt,{date:c}))},"ReopenedEventView"),On=i(o=>{const{createdAt:a,onBehalfOf:u,sessionLink:c}=o,{openSessionLog:f}=(0,l.useContext)(be),p=i(y=>{c&&(c.openToTheSide=y.ctrlKey||y.metaKey,f(c))},"handleSessionLogClick");return l.createElement("div",{className:"comment-container commit"},l.createElement("div",{className:"commit-message"},bi,rt,l.createElement("div",{className:"message"},"Copilot started work on behalf of ",l.createElement(vt,{for:u}))),c?l.createElement("div",{className:"timeline-detail"},l.createElement("a",{onClick:p},l.createElement("button",{className:"secondary",title:"View session log (Ctrl/Cmd+Click to open in second editor group)"},"View session"))):null,l.createElement(Nt,{date:a}))},"CopilotStartedEventView"),Ye=i(o=>{const{createdAt:a,onBehalfOf:u}=o;return l.createElement("div",{className:"comment-container commit"},l.createElement("div",{className:"commit-message"},ki,rt,l.createElement("div",{className:"message"},"Copilot finished work on behalf of ",l.createElement(vt,{for:u}))),l.createElement(Nt,{date:a}))},"CopilotFinishedEventView"),Je=i(o=>{const{createdAt:a,onBehalfOf:u}=o,{openSessionLog:c}=(0,l.useContext)(be),f=i(p=>{o.sessionLink.openToTheSide=p.ctrlKey||p.metaKey,c(o.sessionLink)},"handleSessionLogClick");return l.createElement("div",{className:"comment-container commit"},l.createElement("div",{className:"timeline-with-detail"},l.createElement("div",{className:"commit-message"},so,rt,l.createElement("div",{className:"message"},"Copilot stopped work on behalf of ",l.createElement(vt,{for:u})," due to an error")),l.createElement("div",{className:"commit-message-detail"},l.createElement("a",{onClick:f,title:"View session log (Ctrl/Cmd+Click to open in second editor group)"},"Copilot has encountered an error. See logs for additional details."))),l.createElement(Nt,{date:a}))},"CopilotFinishedErrorEventView"),Yt=i(o=>{const[a,u]=l.useState(window.matchMedia(o).matches);return l.useEffect(()=>{const c=window.matchMedia(o),f=i(()=>u(c.matches),"documentChangeHandler");return c.addEventListener("change",f),()=>{c.removeEventListener("change",f)}},[o]),a},"useMediaQuery"),ct=i(o=>{const a=Yt("(max-width: 768px)");return l.createElement(l.Fragment,null,l.createElement("div",{id:"title",className:"title"},l.createElement("div",{className:"details"},l.createElement(To,{...o}))),a?l.createElement(l.Fragment,null,l.createElement(vs,{...o}),l.createElement(gt,{...o})):l.createElement(l.Fragment,null,l.createElement(gt,{...o}),l.createElement(ur,{...o})))},"Overview"),gt=i(o=>l.createElement("div",{id:"main"},l.createElement("div",{id:"description"},l.createElement(mn,{isPRDescription:!0,comment:o})),l.createElement(Wo,{events:o.events,isIssue:o.isIssue}),l.createElement(Ui,{pr:o,isSimple:!1}),l.createElement($i,{...o})),"Main");function vn(){(0,ie.render)(l.createElement(Dn,null,o=>l.createElement(ct,{...o})),document.getElementById("app"))}i(vn,"main");function Dn({children:o}){const a=(0,l.useContext)(be),[u,c]=(0,l.useState)(a.pr);return(0,l.useEffect)(()=>{a.onchange=c,c(a.pr)},[]),window.onscroll=N(()=>{a.postMessage({command:"scroll",args:{scrollPosition:{x:window.scrollX,y:window.scrollY}}})},200),a.postMessage({command:"ready"}),a.postMessage({command:"pr.debug",args:"initialized "+(u?"with PR":"without PR")}),u?o(u):l.createElement("div",{className:"loading-indicator"},"Loading...")}i(Dn,"Root"),addEventListener("load",vn)})()})();
