<cfcomponent>
	<cfscript>
		if (!StructKeyExists(SESSION,'arrData')) initArray();
	</cfscript>

	<cffunction name="initArray" access="remote" output="false" returntype="void">
		<cfscript>
			var local = {};
			local.arrData = arrayNew(1);
			local.structRow = { ID =  1, URL = 'http://www.pcgames.de/', TEXT = 'PC Games', FLAG = true };
			arrayAppend(local.arrData,local.structRow);
			local.structRow = { ID =  2, URL = 'http://www.pcgameshardware.de/', TEXT = 'PC Games Hardware', FLAG = true };
			arrayAppend(local.arrData,local.structRow);
			local.structRow = { ID =  3, URL = 'http://www.buffed.de/', TEXT = 'Buffed', FLAG = true };
			arrayAppend(local.arrData,local.structRow);;
			local.structRow = { ID =  4, URL = 'http://www.golem.de/', TEXT = 'Golem', FLAG = false };
			arrayAppend(local.arrData,local.structRow);
			local.structRow = { ID =  5, URL = 'http://www.4players.de/', TEXT = '4Players', FLAG = false };
			arrayAppend(local.arrData,local.structRow);
			local.structRow = { ID =  6, URL = 'http://www.linux-magazin.de/', TEXT = 'Linux Magazin', FLAG = false };
			arrayAppend(local.arrData,local.structRow);
			local.structRow = { ID =  7, URL = 'http://www.linux-community.de/', TEXT = 'Linux Community', FLAG = false };
			arrayAppend(local.arrData,local.structRow);
			local.structRow = { ID =  8, URL = 'http://www.areamobile.de/', TEXT = 'AreaMobile', FLAG = true };
			arrayAppend(local.arrData,local.structRow);
			local.structRow = { ID =  9, URL = 'http://www.readmore.de/', TEXT = 'Readmore', FLAG = false };
			arrayAppend(local.arrData,local.structRow);
			local.structRow = { ID = 10, URL = 'http://www.computec.de/', TEXT = 'Computec Media GmbH', FLAG = true };
			arrayAppend(local.arrData,local.structRow);	
			SESSION.idMax = 10;
			SESSION.arrData = local.arrData;
			return;
		</cfscript>
	</cffunction>

	<cffunction name="getSortedQuery" access="private" output="false" returntype="query">
		<cfargument name="sortColumn" type="string" required="yes" />
		<cfargument name="sortDir" type="string" required="yes" />
		<cfscript>
			var local 		= {};
			local.structTmp = {};
			local.lstKeys	= 'ID,URL,TEXT,FLAG';
			local.iNoKeys	= listLen(local.lstKeys);
			local.qReturn 	= queryNew(local.lstKeys,'integer,varchar,varchar,bit');

			for (local.i=1; local.i lte arrayLen(SESSION.arrData); local.i++) {
				local.structTmp[local.i] = SESSION.arrData[local.i];
			}

			local.arrKeys = StructSort(local.structTmp, 'textnocase', arguments.sortDir, arguments.sortColumn);

			for (local.i=1; local.i lte arrayLen(local.arrKeys); local.i++) {
				queryAddRow(local.qReturn);
				local.structRow = local.structTmp[local.arrKeys[local.i]];
				for (local.j=1; local.j lte local.iNoKeys; local.j++) {
					local.strKey = listGetAt(local.lstKeys,local.j);
					querySetCell(local.qReturn, local.strKey, local.structRow[local.strKey],local.i);
				}
			}

			return local.qReturn;
		</cfscript>
	</cffunction>

	<cffunction name="getData" access="remote" output="false" returntype="struct">
		<cfargument name="page" type="numeric" required="yes" />
        <cfargument name="pageSize" type="numeric" required="yes" />
        <cfargument name="gridsortcolumn" type="string" required="yes" />
        <cfargument name="gridsortdirection" type="string" required="yes" />
		<cfargument name="someId" type="numeric" required="yes" />
		<cfscript>
			var qData = '';

			switch(UCase(arguments.gridsortcolumn)) {
				case 'ID':
				case 'URL':
				case 'TEXT':
				case 'FLAG':				
				break;
				default:
				arguments.gridsortcolumn = 'ID';
			}

			switch(UCase(arguments.gridsortdirection)) {
				case 'ASC':
				case 'DESC':
				break;
				default:
				arguments.gridsortdirection = 'DESC';
			}

			/*
				you'd probably populate qData with a query of some sort, most likely something like
				<cfquery name="qData" datasource="myDatasource">
					SELECT id, url, text, flag
					FROM mytable
					WHERE some_id = <cfqueryparam cfsqltype="cf_sql_integer" value="#arguments.someId#">
					ORDER BY #arguments.gridsortcolumn# #arguments.gridsortdirection#
				</cfquery>

				For demo purposes we emulate the database with an array of structs
			*/

			qData = getSortedQuery(sortColumn=arguments.gridsortcolumn,sortDir=arguments.gridsortdirection);

			return queryconvertforgrid(qData,arguments.page,arguments.pagesize);
		</cfscript>
	</cffunction>

	<cffunction name="editData" access="remote" output="false" returntype="void">
		<cfargument name="gridaction">
		<cfargument name="gridrow">
		<cfargument name="gridchanged">
		<cfscript>
			var local = {};

			// find the array row we wish to edit/delete
			local.arrIdx = -1;
			for (local.i=1; local.i lte arrayLen(SESSION.arrData); local.i++) {
				if (SESSION.arrData[local.i]['ID'] eq arguments.gridrow.id) {
					local.arrIdx = local.i;
					break;
				}
			}
			if (local.arrIdx eq -1) {
				// record not found, so just return
				return;
			}

			if (isStruct(arguments.gridrow) and isStruct(arguments.gridchanged)) {
				if (arguments.gridaction eq "U") {
					// UPDATE
					local.colname=structkeylist(arguments.gridchanged);
					/* 
						if we were actually dealing with a database, 
						we would want to determine the datatype
						and protect against arbitrary setting of fields
					*/
					switch(local.colname){
						case 'TEXT':
						case 'URL':	
							local.dataType = 'cf_sql_varchar';
							break;						
						case 'FLAG':
							local.dataType = 'cf_sql_bit';
						break;
						default:
							return;
					}
					local.value=arguments.gridchanged[local.colname];
					SESSION.arrData[local.arrIdx][local.colname] = local.value;					
				} else if (arguments.gridaction eq "D") {
					arrayDeleteAt(SESSION.arrData, local.arrIdx);					
				}
			}
			return;
		</cfscript>
	</cffunction>

	<cffunction name="addData" access="remote" output="false" returntype="string" returnFormat="plain">	
		<cfargument name="someId" required="yes" type="numeric">
		<cfargument name="URL" required="yes" type="string">
		<cfargument name="TEXT" default="Link" required="no" type="string">
		<cfargument name="FLAG" default="false" required="no" type="boolean">
		<cfscript>
			local = {};
			local.structResult = {BSUCCESS = true, STRMESSAGE = 'Entry added'};
			SESSION.idMax++;
			local.structRow = { ID = SESSION.idMax, URL = arguments.URL, TEXT = arguments.TEXT, FLAG = arguments.FLAG };
			arrayAppend(SESSION.arrData, local.structRow);
			return SerializeJson(local.structResult);
		</cfscript>
	</cffunction>

</cfcomponent>