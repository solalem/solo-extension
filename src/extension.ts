'use strict';

import * as vscode from 'vscode';

import { ModelView } from './modeling/modelView';
import { CodeTreeView } from './codeTrees/codeTreeView';

export function activate(context: vscode.ExtensionContext) {
	new ModelView(context);
	new CodeTreeView(context);

	const cat = vscode.chat.createChatParticipant('chat.solo', soloChatHandler);
}

const soloChatHandler: vscode.ChatRequestHandler = async (
	request: vscode.ChatRequest,
	context: vscode.ChatContext,
	stream: vscode.ChatResponseStream,
	token: vscode.CancellationToken
  ): Promise<ISoloChatResult> => {

	if (request.command == 'model') {
	 	// getModelSchema(request.prompt, request.prompt);
	    stream.push(new vscode.ChatResponseMarkdownPart('Model schema: ' + request.prompt));
		stream.markdown('User prompt' + request.prompt + '\n' );
		stream.markdown('```json\n' );
		stream.markdown('{"test": "test"}\n' );
		stream.markdown('```\n' );
	} else {
	  // Determine the user's intent
	  // const intent = determineUserIntent(request.prompt, request.variables, request.model);
	  // Add logic here to handle other scenarios
	}

	return {};
  };
  
  interface ISoloChatResult {}