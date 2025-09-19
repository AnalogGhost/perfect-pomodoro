#!/bin/bash

# Manual Screenshot Guide for Perfect Pomodoro Timer
# Step-by-step guide with plenty of time to click things

set -e

echo "📸 Perfect Pomodoro Timer - Manual Screenshot Guide"
echo "================================================="
echo ""
echo "This script will guide you through taking screenshots step by step."
echo "You'll have plenty of time to click buttons and navigate the UI."
echo ""

# Function to wait for user input
wait_for_user() {
    local message="$1"
    echo ""
    echo "🔔 $message"
    echo "📱 Press ENTER when ready to continue..."
    read -r
}

# Function to take a screenshot with countdown
take_screenshot_with_countdown() {
    local filename="$1"
    local description="$2"
    local countdown="${3:-5}"

    echo ""
    echo "📸 Taking screenshot: $description"
    echo "📁 Saving as: screenshots/$filename"
    echo ""

    for i in $(seq $countdown -1 1); do
        echo "📸 Screenshot in $i seconds... (position your window now)"
        sleep 1
    done

    echo "📸 Taking screenshot NOW!"

    # Try different screenshot tools
    if command -v gnome-screenshot &> /dev/null; then
        gnome-screenshot -w -f "screenshots/$filename"
    elif command -v flameshot &> /dev/null; then
        flameshot gui --path screenshots --filename "$filename"
    elif command -v spectacle &> /dev/null; then
        spectacle -w -b -o "screenshots/$filename"
    else
        echo "❌ No screenshot tool found. Please install one:"
        echo "   sudo apt install gnome-screenshot"
        return 1
    fi

    if [ -f "screenshots/$filename" ]; then
        echo "✅ Screenshot saved: screenshots/$filename"
    else
        echo "❌ Failed to save screenshot. You can:"
        echo "   1. Try again"
        echo "   2. Use: gnome-screenshot -w -f screenshots/$filename"
    fi
}

# Create screenshots directory
mkdir -p screenshots

echo "🚀 Let's start by launching your app..."
echo ""
echo "🔧 First, we need to start Perfect Pomodoro Timer."
echo "   You can use either:"
echo "   • npm start"
echo "   • ./dist/linux-unpacked/perfect-pomodoro (if built)"
echo "   • Or run your .AppImage file"

wait_for_user "Start your Perfect Pomodoro Timer app now"

echo "✅ Great! Now let's take the screenshots..."
echo ""

# Screenshot 1: Main Interface
echo "📱 SCREENSHOT 1: Main Interface"
echo "========================================="
echo ""
echo "🎯 What to do:"
echo "   1. Make sure your app window is visible and focused"
echo "   2. Select a nice theme (Forest or Ocean recommended)"
echo "   3. Start a work session (click the play button)"
echo "   4. Let the timer run for a few seconds to show progress"
echo "   5. Position the window nicely on your screen"
echo ""
echo "💡 Tips:"
echo "   • Choose a theme that looks good (not the plain default)"
echo "   • Make sure the timer is running (showing progress)"
echo "   • The window should be centered and clearly visible"

wait_for_user "Set up your main interface as described above"

take_screenshot_with_countdown "main-interface.png" "Main timer interface" 10

# Screenshot 2: Session History
echo ""
echo "📊 SCREENSHOT 2: Session History"
echo "========================================="
echo ""
echo "🎯 What to do:"
echo "   1. Look for a 'History' button or menu item in your app"
echo "   2. Click it to open the session history window"
echo "   3. If you don't have history data yet, that's OK!"
echo "   4. The screenshot should show the history interface"
echo ""
echo "💡 Tips:"
echo "   • Look for buttons labeled 'History', 'Sessions', or 'Stats'"
echo "   • It might be in a menu or toolbar"
echo "   • Even an empty history screen is fine for the screenshot"

wait_for_user "Open the session history window"

take_screenshot_with_countdown "session-history.png" "Session history and statistics" 8

# Screenshot 3: Settings Panel
echo ""
echo "⚙️  SCREENSHOT 3: Settings Panel"
echo "========================================="
echo ""
echo "🎯 What to do:"
echo "   1. Look for a 'Settings' button or gear icon"
echo "   2. Click it to open the settings panel"
echo "   3. Make sure the main settings are visible"
echo "   4. Show the timer duration settings if possible"
echo ""
echo "💡 Tips:"
echo "   • Settings might be a gear icon, 'Settings' button, or in a menu"
echo "   • Try right-clicking on the app if there's a context menu"
echo "   • Show the general settings tab/page"

wait_for_user "Open the settings panel"

take_screenshot_with_countdown "settings.png" "Settings panel" 8

# Screenshot 4: Theme Selection
echo ""
echo "🎨 SCREENSHOT 4: Theme Selection"
echo "========================================="
echo ""
echo "🎯 What to do:"
echo "   1. In the settings panel, look for 'Themes' or 'Appearance'"
echo "   2. Click on it to show the theme selection"
echo "   3. Make sure multiple themes are visible"
echo "   4. This shows the customization options"
echo ""
echo "💡 Tips:"
echo "   • Might be a tab within settings called 'Themes' or 'Appearance'"
echo "   • Should show the different color schemes available"
echo "   • If it's the same window as settings, that's fine too"

wait_for_user "Navigate to the theme selection area"

take_screenshot_with_countdown "themes.png" "Theme selection" 8

# All done!
echo ""
echo "🎉 All screenshots taken!"
echo "========================="
echo ""
echo "📁 Your screenshots are in the 'screenshots/' directory:"
ls -la screenshots/ 2>/dev/null || echo "   (No screenshots directory found)"

echo ""
echo "🔧 Next steps:"
echo "   1. Check that all screenshots look good"
echo "   2. Retake any that didn't work"
echo "   3. Run the optimization script: ./optimize-screenshots.sh"
echo ""
echo "🔄 To retake a specific screenshot:"
echo "   gnome-screenshot -w -f screenshots/FILENAME.png"
echo ""
echo "   Where FILENAME is one of:"
echo "   • main-interface.png"
echo "   • session-history.png"
echo "   • settings.png"
echo "   • themes.png"

echo ""
echo "✅ Screenshot process complete!"
echo "🚀 Ready to optimize for Flathub submission!"