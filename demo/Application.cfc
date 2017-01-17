<cfcomponent>
    <cfscript>
        this.name               = "UnCFGridDemo";
        this.applicationTimeout = CreateTimeSpan(1, 0, 0, 0);
        this.clientManagement   = false;    
        this.sessionManagement  = true;
        this.sessionTimeout     = CreateTimeSpan(0, 0, 15, 0);
        this.setClientCookies   = true;
        this.setDomainCookies   = true;
        this.scriptProtect      = false;
        this.secureJSON         = false;
    </cfscript>

    <cffunction name="onApplicationStart" output="false" returntype="boolean">
        <cfreturn true />
    </cffunction>

    <cffunction name="onApplicationEnd" output="false" returntype="void">
        <cfargument name="applicationScope" required="true" />
        <cfreturn />
    </cffunction>

    <cffunction name="onSessionStart" access="public" output="false" returntype="void">       
        <cfreturn />
    </cffunction>

    <cffunction name="OnSessionEnd" access="public" output="false" returntype="void">       
        <cfargument name="SessionScope" type="struct" required="true" />
        <cfargument name="ApplicationScope" type="struct" required="false" default="#StructNew()#" />
        <cfreturn />
    </cffunction>

    <cffunction name="onRequestStart" access="public" output="true" returntype="boolean">       
        <cfargument name="targetPage" type="string" required="true" />        
        <cfreturn true />
    </cffunction>

    <cffunction name="onRequestEnd" access="public" output="false" returntype="void">       
        <cfargument name="targetPage" type="string" required="true" />        
        <cfreturn />
    </cffunction>
</cfcomponent>