/**
* @class
* This namespace contains functionality associated with adding navigation items to the navigation menu of Gmail and Inbox.
* Typically, these navigation links are accessible by the user on the left side of the email client and include built in
* navigation items like the Inbox, Sent Mail or Drafts links.
*
* This namespace allows you to add your own items to this Navigation menu. Typically, these navigation items are useful
* to send users to different Routes that you have already registered providing navigation for your entire application.
*
* The navigation menu is represented as a tree structure of items. Each item can have 0 or more children and there are
* several options to configure the appearance of the items.
*
* Items can also have accessories which provide secondary actions like opening a dropdown (like Gmails labels) or
* providing a "create new" action. There are several predefined accesories, see {CreateAccessoryDescriptor},
* {IconButtonAccessoryDescriptor} or {DropdownButtonAccessoryDescriptor}.
*/
var NavMenu = /** @lends NavMenu */{

	/**
	* Adds a navigation item to the root of the navigation menu. Navigation items from your app are grouped together
	* where possible but ultimately the SDK optimizes for the best user experience when displaying navigation items.
	* @param {NavItemDescriptor} navItemDescriptor - A single descriptor for the nav item or stream of NavItemDescriptors.
	* @return {NavItemView}
	*/
	addNavItem: function(){},

	SENT_MAIL: null

};

/**
* @class
* This object represents the set of options to configure a new {NavItemView}.
*/
var NavItemDescriptor = /** @lends NavItemDescriptor */ {

	/**
	* Name of the NavItem to be used for display
	* @type {string}
	*/
	name: null,

	/**
	* The ID of the route to navigate to when the NavItemView is clicked on.
	* ^optional
	* ^default=null
	* @type {string}
	*/
	routeID: null,

	/**
	* The parameters of the route being navigated to when the NavItemView is clicked on.
	* ^optional
	* ^default=null
	* @type {Object}
	*/
	routeParams: null,


	/**
	* Used to specify the order in which your NavItemViews should be relative to each other
	* ^optional
	* ^default=Number.MAX_SAFE_INTEGER
	* @type {integer}
	*/
	orderHint: null,

	/**
	* There are several "accessories" which can provide secondary actions for {NavItemView}s
	* ^optional
	* ^default=null
	* @type {CreateAccessoryDescriptor|IconButtonAccessoryDescriptor|DropdownButtonAccessoryDescriptor}
	*/
	accessory: null,

	/**
	* An optional url to an icon to display an icon alongside the name of the {NavItemView}
	* ^optional
	* ^default=null
	* @type {string}
	*/
	iconUrl: null,

	/**
	* An optional class to apply to the icon.
	* ^optional
	* ^default=null
	* @type {string}
	*/
	iconClass: null

};

/**
* @class
* The CreateAccessoryDescriptor allows you to add an action to allow the user to create a new child of this item.
*/
var CreateAccessoryDescriptor = /** @lends CreateAccessoryDescriptor */ {

	/**
	* For CreateAccessoryDescriptors this should always be set to {CREATE}
	* @type {string}
	*/
	type: 'CREATE',

	/**
	* Callback for when the "Create New" accessory is pressed.
	* @type {function}
	*/
	onClick: null
};


/**
* @class
* The IconButtonAccessoryDescriptor allows you to add an icon button right next your {NavItem} which lets the user take a secondary action
*/
var IconButtonAccessoryDescriptor = /** @lends IconButtonAccessoryDescriptor */ {

	/**
	* For IconButtonAccessoryDescriptors this should always be set to {ICON_BUTTON}
	* @type {string}
	*/
	type: 'ICON_BUTTON',

	/**
	* Callback for when the IconButton accessory is pressed.
	* @type {function}
	*/
	onClick: null,

	/**
		* A URL for the icon to be displayed in the button.
		* @type {string}
	*/
	iconUrl: null,

	/**
	* An optional class to add to the icon.
	* ^optional
	* ^default=null
	* @type {string}
	*/
	iconClass: null
};


/**
* @class
* The DropdownButtonAccessoryDescriptor allows you to add a dropdown right next your {NavItemView}
*/
var DropdownButtonAccessoryDescriptor = /** @lends DropdownButtonAccessoryDescriptor */ {

	/**
	* For DropdownButtonAccessoryDescriptors this should always be set to {DROPDOWN_BUTTON}
	* @type {string}
	*/
	type: 'DROPDOWN_BUTTON',

	/**
	* The color of the background of the dropdown button.
	* @type {string}
	*/
	buttonBackgroundColor: null,

	/**
	* The color of the foreground of the dropdown button.
	* @type {string}
	*/
	buttonForegroundColor: null,

	/**
	* A callback when the dropdown button is pressed. The event object passed to you has a
	* dropdown property which you can fill your content with.
	* @type {func(event)}
	*/
	onClick: null
};