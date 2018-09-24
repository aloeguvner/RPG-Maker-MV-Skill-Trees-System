//=============================================================================
// SkillTreesSystem.js
//=============================================================================

/*:
 * @plugindesc v1.0 Basic skill trees in a separate scene.
 *
 * @author SomeFire
 *
 * @help
 * ============================================================================
 * Introduction and Instructions
 * ============================================================================
 *
 * To use this plugin you need to create your own skill trees in the
 * SkillTreesConfig.js file and add trees to the actors when the game starts.
 *
 * For example:
 *     $gameActors.actor(actorId).skillTrees = SkillTreesSystem.actor2tree[X];
 *
 * actor.skillTrees - is the new field, it should be filled for all actors.
 *
 * SkillTreesSystem.actor2tree[X] - is a key-value map where
 *  value is skill trees object. See config file for example.
 *
 * To add skill points use next code:
 *     $gameActors.actor(actorId).skillTrees.points += X;
 *
 * X is points you want to give.
 *
 * ============================================================================
 * Changelog
 * ============================================================================
 *
 * Version 1.0:
 * - Finished plugin!
 *
 */

//=============================================================================
// System Variables
//=============================================================================

var SkillTreesSystem = SkillTreesSystem || {};

SkillTreesSystem.enabled = true;

/** Text for the menu button. */
SkillTreesSystem.buttonValue = 'Skill Trees';

/** Amount of skill slots in a single row. */
SkillTreesSystem.maxCols = 7;

/** Use big cursor for skill icons with opaque background. Use small cursor for icons with transparent background. */
SkillTreesSystem.skillCursorPadding = true;

SkillTreesSystem.isEnabled = function() {
    return this.enabled;
};

//-----------------------------------------------------------------------------
// Scene_SkillTrees
//
// The scene with hero's skill trees.

function Scene_SkillTrees() {
    this.initialize.apply(this, arguments);
}

Scene_SkillTrees.prototype = Object.create(Scene_MenuBase.prototype);
Scene_SkillTrees.prototype.constructor = Scene_Menu;

Scene_SkillTrees.prototype.initialize = function() {
    Scene_MenuBase.prototype.initialize.call(this);
};

Scene_SkillTrees.prototype.create = function() {
    Scene_MenuBase.prototype.create.call(this);
  
    this._treesWindow = new Trees_Window(0, 0);
    this._treesWindow.setHandler('pagedown', this.nextActor.bind(this));
    this._treesWindow.setHandler('pageup',   this.previousActor.bind(this));
    this._treesWindow.setHandler('ok',     this.onTreeOk.bind(this));
    this._treesWindow.setHandler('cancel', this.popScene.bind(this));
    this.addWindow(this._treesWindow);

    this._skillsWindow = new Skills_Window(0, this._treesWindow.windowHeight());
    this.addWindow(this._skillsWindow);
    this._skillsWindow.setHandler('ok',     this.onItemOk.bind(this));
    this._skillsWindow.setHandler('cancel', this.onItemCancel.bind(this));
    this._treesWindow.setSkillsWindow(this._skillsWindow);

    this._descriptionWindow = new Description_Window(this._skillsWindow.windowWidth(), this._treesWindow.windowHeight());
    this.addWindow(this._descriptionWindow);
    this._treesWindow.setDescriptionWindow(this._descriptionWindow);
    this._skillsWindow.setDescriptionWindow(this._descriptionWindow);
};

Scene_SkillTrees.prototype.start = function() {
    Scene_MenuBase.prototype.start.call(this);
    this.refreshActor();
    this._treesWindow.refresh();
    this._skillsWindow.refresh();
    this._descriptionWindow.refresh();
};

Scene_SkillTrees.prototype.refreshActor = function() {
    var actor = this.actor();
    this._treesWindow.setActor(actor);
    this._skillsWindow.setActor(actor);
    this._descriptionWindow.setActor(actor);
};

Scene_SkillTrees.prototype.onActorChange = function() {
    this.refreshActor();
    this._treesWindow.activate();
    this._treesWindow.selectLast();
};

Scene_SkillTrees.prototype.onTreeOk = function() {
    this._skillsWindow.activate();
    this._skillsWindow.selectLast();
};

Scene_SkillTrees.prototype.onItemOk = function() {
    var actor = this._descriptionWindow._actor;
    var tree = this._descriptionWindow._tree;
    var skill = this._descriptionWindow._skill;

    if (skill.isAvailableToLearn(actor, tree)) {
        skill.learn(actor, tree);
        this._skillsWindow.refresh();
        this._descriptionWindow.refresh();
    }

    this._skillsWindow.activate();
};

Scene_SkillTrees.prototype.onItemCancel = function() {
    Skills_Window._lastSelectedIndex[this._skillsWindow._tree.symbol] = this._skillsWindow.index();
    this._skillsWindow.deselect();
    this._treesWindow.activate();
};

//-----------------------------------------------------------------------------
// Trees Window
//
// The window for selecting a skill tree on the abilities screen.

function Trees_Window() {
  this.initialize.apply(this, arguments);
}

Trees_Window.prototype = Object.create(Window_Command.prototype);
Trees_Window.prototype.constructor = Trees_Window;

Trees_Window.prototype.initialize = function(x, y) {
    Window_Command.prototype.initialize.call(this, x, y, this.windowWidth(), this.windowHeight());
  
    this.selectLast();
};

Trees_Window.prototype.setSkillsWindow = function(skillsWindow) {
    this._skillsWindow = skillsWindow;
};

Trees_Window.prototype.setDescriptionWindow = function(descriptionWindow) {
    this._descriptionWindow = descriptionWindow;
};

Trees_Window.initCommandPosition = function() {
    Trees_Window._lastCommandSymbol = null;
};

Trees_Window.prototype.windowWidth = function() {
  return Graphics.boxWidth;
};

Trees_Window.prototype.windowHeight = function() {
    return this.fittingHeight(1);
};

Trees_Window.prototype.numVisibleRows = function() {
    return 1;
};

Trees_Window.prototype.maxCols = function() {
    return 3;
};

Trees_Window.prototype.makeCommandList = function() {
    if (this._actor) {
        this.addCommand(this._actor.skillTrees.trees[0].name, this._actor.skillTrees.trees[0].symbol, true);
        this.addCommand(this._actor.skillTrees.trees[1].name, this._actor.skillTrees.trees[1].symbol, true);
        this.addCommand(this._actor.skillTrees.trees[2].name, this._actor.skillTrees.trees[2].symbol, true);
    }
};

Trees_Window.prototype.processOk = function() {
    Trees_Window._lastCommandSymbol = this.currentSymbol();
    Window_Command.prototype.processOk.call(this);
};

Trees_Window.prototype.selectLast = function() {
    this.selectSymbol(Trees_Window._lastCommandSymbol);
};

Trees_Window.prototype.select = function(index) {
    Window_Selectable.prototype.select.call(this, index);

    if (this._actor && this._descriptionWindow)
        this._descriptionWindow.showDescripion(this._actor.skillTrees.trees[index], null);
};

Trees_Window.prototype.setActor = function(actor) {
    if (this._actor !== actor) {
        this._actor = actor;
        this.refresh();
        this.selectLast();
    }
};

Trees_Window.prototype.update = function() {
    Window_Command.prototype.update.call(this);

    if (this._skillsWindow && this.currentSymbol())
        this._skillsWindow.setSkillTree(this.currentSymbol());
};

Trees_Window.prototype.itemTextAlign = function() {
    return 'center';
};

//-----------------------------------------------------------------------------
// Skills Window
//
// The window for selecting a skill on the abilities screen.

function Skills_Window() {
  this.initialize.apply(this, arguments);
}

Skills_Window._lastSelectedIndex = {};

Skills_Window.prototype = Object.create(Window_Selectable.prototype);
Skills_Window.prototype.constructor = Skills_Window;

Skills_Window.prototype.initialize = function(x, y) {
    Window_Selectable.prototype.initialize.call(this, x, y, this.windowWidth(), this.windowHeight());
    this._actor = null;
    this._tree = null;
    this._descriptionWindow = null;
};

Skills_Window.prototype.setDescriptionWindow = function(descriptionWindow) {
    this._descriptionWindow = descriptionWindow;
};

Skills_Window.prototype.maxItems = function() {
    return this._tree.skills.length;
};

Skills_Window.prototype.maxCols = function() {
    return SkillTreesSystem.maxCols;
};

Skills_Window.prototype.windowWidth = function() {
    return Window_Base._iconWidth * SkillTreesSystem.maxCols + this.standardPadding() * 2 - 8;
};

Skills_Window.prototype.windowHeight = function() {
    return Graphics.boxHeight - this.fittingHeight(1);
};

Skills_Window.prototype.setActor = function(actor) {
    if (this._actor !== actor) {
        this._actor = actor;
        this.refresh();
    }
};

Skills_Window.prototype.setSkillTree = function(symbol) {
    this._tree = this.findTree(symbol);
    this.refresh();
};

Skills_Window.prototype.findTree = function(symbol) {
    var trees = this._actor.skillTrees.trees;

    for (var i = 0; i < trees.length; i++) {
        if (trees[i].symbol === symbol)
            return trees[i];
    }

    console.error("Skill tree \"" + symbol + "\" wasn't found.");
    return null;
};

Skills_Window.prototype.itemWidth = function() {
    return Window_Base._iconWidth;
};

Skills_Window.prototype.itemHeight = function() {
    return Window_Base._iconHeight;
};

Skills_Window.prototype.drawItem = function(treeObj, index) {
    var x = Window_Base._iconWidth * (index % SkillTreesSystem.maxCols);
    var y = Window_Base._iconHeight * Math.floor(index / SkillTreesSystem.maxCols);

    this.changePaintOpacity(treeObj.isEnabled(this._actor, this._tree));
    this.drawIcon(treeObj.iconId(), x, y);
    this.changePaintOpacity(1);

    if (treeObj instanceof Skill) {
        var size = this.contents.fontSize;
        this.contents.fontSize = Window_Base._iconHeight / 3;

        if (treeObj.currentLevel() === treeObj.maxLevel())
            var text = "MAX";
        else
            text = treeObj.currentLevel() + "/" + treeObj.maxLevel();

        this.drawText(text, x + 2, y + Window_Base._iconHeight / 4, Window_Base._iconWidth - 4, 'center');

        this.contents.fontSize = size;
    }
};

Skills_Window.prototype.drawAllItems = function() {
    if (!this._tree)
        return;

    this._tree.skills.forEach(function(item, idx) {
        if (item instanceof TreeObject)
            this.drawItem(item, idx);
    }, this);
};

Skills_Window.prototype.refresh = function() {
    if (this.contents) {
        this.contents.clear();
        this.drawAllItems();
    }
};

Skills_Window.prototype.select = function(index) {
    if (index !== -1 && (this._tree && !(this._tree.skills[index] instanceof Skill)))
        return;

    Window_Selectable.prototype.select.call(this, index);

    if (this._descriptionWindow)
        this._descriptionWindow.showDescripion(this._tree, this._tree.skills[index]);
};

Skills_Window.prototype.selectLast = function() {
    if (!Skills_Window._lastSelectedIndex[this._tree.symbol]) {
        for (let i = 0; i < this._tree.skills.length; i++) {
            if (this._tree.skills[i] instanceof Skill) {
                Skills_Window._lastSelectedIndex[this._tree.symbol] = i;
                break;
            }
        }
    }

    this.select(Skills_Window._lastSelectedIndex[this._tree.symbol]);
};

Skills_Window.prototype.itemRect = function(index) {
    var rect = new Rectangle();
    var maxCols = this.maxCols();
    rect.width = this.itemWidth();
    rect.height = this.itemHeight();
    rect.x = Window_Base._iconWidth * (index % SkillTreesSystem.maxCols);
    rect.y = Window_Base._iconHeight * Math.floor(index / SkillTreesSystem.maxCols);
    return rect;
};

Skills_Window.prototype.updateCursor = function() {
    if (this.isCursorVisible()) {
        var rect = this.itemRect(this.index());

        if (SkillTreesSystem.skillCursorPadding) {
            this.setCursorRect(rect.x + this.spacing() / 2, rect.y + this.spacing() / 2,
                rect.width + this.spacing(), rect.height + this.spacing());
        } else
            this.setCursorRect(rect.x, rect.y, rect.width, rect.height);
    } else
        this.setCursorRect(0, 0, 0, 0);

    /*
    if (this._cursorAll) {
        var allRowsHeight = this.maxRows() * this.itemHeight();
        this.setCursorRect(0, 0, this.contents.width, allRowsHeight);
        this.setTopRow(0);
    } else if (this.isCursorVisible()) {
        var rect = this.itemRect(this.index());
        this.setCursorRect(rect.x, rect.y, rect.width, rect.height);
    } else {
        this.setCursorRect(0, 0, 0, 0);
    }
    */
};

Skills_Window.prototype.cursorDown = function(wrap) {
    var index = this.index();
    var maxItems = this.maxItems();
    var maxCols = this.maxCols();
    var index0 = this.index() % maxCols;
    var skills = this._tree.skills;

    while (index < maxItems) {
        index = index + maxCols;

        if (index >= maxItems && index0 < maxCols)
            index = ++index0;

        if (index < maxItems && skills[index] instanceof Skill)
            break;
    }

    if (skills[index])
        this.select(index);
};

Skills_Window.prototype.cursorUp = function(wrap) {
    var index = this.index();
    var maxItems = this.maxItems();
    var maxCols = this.maxCols();
    var index0bound = Math.floor(maxItems / maxCols) * maxCols;
    var index0 = this.index() % maxCols + index0bound;
    var skills = this._tree.skills;

    while (index >= 0) {
        index = index - maxCols;

        if (index < 0 && index0 - 1 > index0bound)
            index = --index0;

        if (index >= 0 && skills[index] instanceof Skill)
            break;
    }

    if (skills[index])
        this.select(index);
};

Skills_Window.prototype.cursorRight = function(wrap) {
    var index = this.index();
    var maxItems = this.maxItems();
    var maxCols = this.maxCols();
    var skills = this._tree.skills;

    if (maxCols >= 2 && (index < maxItems - 1 || (wrap && this.isHorizontal()))) {
        while (++index < maxItems && !(skills[index] instanceof Skill));

        if (skills[index])
            this.select((index) % maxItems);
    }
};

Skills_Window.prototype.cursorLeft = function(wrap) {
    var index = this.index();
    var maxItems = this.maxItems();
    var maxCols = this.maxCols();
    var skills = this._tree.skills;

    if (maxCols >= 2 && (index > 0 || (wrap && this.isHorizontal()))) {
        while (--index > 0 && !(skills[index] instanceof Skill));

        if (skills[index])
            this.select((index + maxItems) % maxItems);
    }
};

/**
 * @method _refreshCursor
 * @private
 */
Skills_Window.prototype._refreshCursor = function() {
    this._padding -= this.spacing();
    Window.prototype._refreshCursor.call(this);
    this._padding += this.spacing();
};

Skills_Window.prototype.isCursorVisible = function() {
    var row = this.row();

    return row >= this.topRow() && row <= this.bottomRow();
};

Skills_Window.prototype.ensureCursorVisible = function() {
    // TODO for long skill trees
    /*
    var row = this.row();
    if (row < this.topRow()) {
        this.setTopRow(row);
    } else if (row > this.bottomRow()) {
        this.setBottomRow(row);
    }
     */
};

//-----------------------------------------------------------------------------
// Description Window
//
// The window showing a skill description on the abilities screen.

function Description_Window() {
    this.initialize.apply(this, arguments);
}

Description_Window.prototype = Object.create(Window_Base.prototype);
Description_Window.prototype.constructor = Description_Window;

Description_Window.prototype.initialize = function(x, y) {
    Window_Base.prototype.initialize.call(this, x, y, this.windowWidth(), this.windowHeight());
    this._actor = null;
    this._tree = null;
    this._skill = null;
};

Description_Window.prototype.windowWidth = function() {
    return Graphics.boxWidth - (Window_Base._iconWidth * SkillTreesSystem.maxCols + this.standardPadding() * 2 - 8);
};

Description_Window.prototype.windowHeight = function() {
    return Graphics.boxHeight - this.fittingHeight(1);
};

Description_Window.prototype.setActor = function(actor) {
    if (this._actor !== actor) {
        this._actor = actor;
        this.refresh();
    }
};

Description_Window.prototype.showDescripion = function (tree, skill) {
    if (this._skill !== skill || this._tree !== tree) {
        this._skill = skill;
        this._tree = tree;
        this.refresh();
    }
};

Description_Window.prototype.refresh = function() {
    if (this.contents) {
        this.contents.clear();

        var fullW = this.windowWidth() - this.padding * 2;
        var w = (fullW - Window_Base._faceWidth) / 2;

        if (this._actor && this._tree) {

            this.drawActorFace(this._actor, 0, 0, Window_Base._faceWidth, Window_Base._faceHeight);

            this.drawActorName(this._actor, Window_Base._faceWidth, 0, w);
            this.drawActorLevel(this._actor, Window_Base._faceWidth + w, 0);

            this.drawActorClass(this._actor, Window_Base._faceWidth, this.lineHeight(), w);
            this.drawActorFreePoints(this._actor, Window_Base._faceWidth + w, this.lineHeight(), w);

            this.drawActorTreePoints(this._actor, this._tree, Window_Base._faceWidth, this.lineHeight() * 2, w * 2);

            // Line 3 is empty.
            this.drawLine(this.lineHeight() * 4);
        }

        if (this._skill) {
            var skill = this._skill.nextLevel();

            this.drawIcon(this._skill.iconId(), 0, this.lineHeight() * 5);
            this.drawText(skill.name, Window_Base._iconWidth + this.spacing(), this.lineHeight() * 5, this.windowWidth() - w - Window_Base._iconWidth - this.spacing());
            this.drawCastCost(skill, this.windowWidth() - w, this.lineHeight() * 5, w);

            var desc = skill.description.split("\n");

            this.drawText(desc[0], 0, this.lineHeight() * 6, fullW);
            this.drawText(desc[1], 0, this.lineHeight() * 7, fullW);

            var reqs = this._skill.requirements();

            if (reqs) {
                this.drawLine(this.lineHeight() * 8);
                this.drawText(SkillTreesSystem.requirementsText(), 0, this.lineHeight() * 9);
                this.drawRequirements(reqs, this.lineHeight() * 10);
            }
            /*
              level = [@actor.est_skill_level(@skill_object, @tree_id) - 1, 0].max # Which element of the row with skill IDs should be picked?
              if !@actor.est_skill_maxed?(@skill_object, @tree_id) and @actor.est_skill_level(@skill_object, @tree_id) != 0 and EME::SKILL_TREES::DISPLAY_NEXT_LEVEL
                @current_skill = $data_skills[@skill_object[1][level + 1]]
              else
                @current_skill = $data_skills[@skill_object[1][level]] # The skill that will be picked
              end
              draw_skill_name(0, 106, EME::SKILL_TREES::COST_X - 24)
              draw_skill_cost(EME::SKILL_TREES::COST_X, 106)
              draw_skill_level(136, 1130)
              draw_description(0, 154)
              draw_line_2
              draw_requirements(0, 208)
             */
        }
    }
};

Description_Window.prototype.drawActorFreePoints = function(actor, x, y, width) {
    var text = SkillTreesSystem.freePointsText();
    var textWidth = this.textWidth(text);
    textWidth = (textWidth < width - 50) ? textWidth : width - 50;
    var valWidth = width - textWidth;

    this.changeTextColor(this.systemColor());
    this.drawText(text, x, y, textWidth);
    this.changeTextColor(this.normalColor());
    this.drawText(actor.skillTrees.points, x + this.textWidth(text), y, valWidth);
};

Description_Window.prototype.drawActorTreePoints = function(actor, tree, x, y, width) {
    var text = SkillTreesSystem.treePointsText(tree);
    var textWidth = this.textWidth(text);
    textWidth = (textWidth < width - 50) ? textWidth : width - 50;
    var valWidth = width - textWidth;

    this.changeTextColor(this.systemColor());
    this.drawText(text, x, y, textWidth);
    this.changeTextColor(this.normalColor());
    this.drawText(this._tree.points, x + textWidth, y, valWidth);
};

/**
 * I don't know why this method
 *
 * @param y Text line where horizontal line should be drawn.
 */
Description_Window.prototype.drawLine = function(y) {
    var lineY = y + this.lineHeight() / 2 - 1;
    this.contents.paintOpacity = 48;
    this.contents.fillRect(0, lineY, this.windowWidth() - this.padding * 2, 2, this.normalColor());
    this.contents.paintOpacity = 255;
};

Description_Window.prototype.drawCastCost = function(skill, x, y, w) {
};

Description_Window.prototype.drawRequirements = function(reqs, y) {
    for (var i = 0; i < reqs.length; i++) {
        var req = reqs[i];

        this.drawText(req.text(), 0, y);

        y += this.lineHeight();
    }
};

Description_Window.prototype.spacing = function() {
    return 12;
};
