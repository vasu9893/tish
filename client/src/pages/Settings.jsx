import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar'
import { Badge } from '../components/ui/badge'
import { 
  User, 
  Mail, 
  Instagram, 
  Shield, 
  Key, 
  Globe, 
  Bell, 
  Trash2,
  Edit,
  Save,
  X,
  CheckCircle,
  AlertCircle
} from 'lucide-react'

const Settings = ({ user, onLogout }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [profileData, setProfileData] = useState({
    username: user.username,
    email: user.email,
    fullName: user.fullName || '',
    bio: user.bio || ''
  })
  const [instagramStatus, setInstagramStatus] = useState({
    connected: false,
    username: '',
    lastSync: null
  })
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Load Instagram connection status
    loadInstagramStatus()
  }, [])

  const loadInstagramStatus = async () => {
    try {
      // For demo, we'll use sample data
      setInstagramStatus({
        connected: true,
        username: 'instantchat_official',
        lastSync: '2 hours ago'
      })
    } catch (error) {
      console.error('Error loading Instagram status:', error)
    }
  }

  const handleProfileUpdate = async () => {
    setIsLoading(true)
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Update user object
      Object.assign(user, profileData)
      
      setIsEditing(false)
    } catch (error) {
      console.error('Error updating profile:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInstagramDisconnect = async () => {
    if (!window.confirm('Are you sure you want to disconnect your Instagram account?')) {
      return
    }

    setIsLoading(true)
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setInstagramStatus({
        connected: false,
        username: '',
        lastSync: null
      })
    } catch (error) {
      console.error('Error disconnecting Instagram:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInstagramConnect = () => {
    // Navigate to Instagram connection page
    window.location.href = '/connect-instagram'
  }

  return (
    <div className="space-y-6">
      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="w-5 h-5" />
            <span>Profile Settings</span>
          </CardTitle>
          <CardDescription>
            Manage your account information and preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar Section */}
          <div className="flex items-center space-x-4">
            <Avatar className="w-20 h-20">
              <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} />
              <AvatarFallback className="text-2xl">{user.username.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-lg font-medium">{user.username}</h3>
              <p className="text-sm text-gray-500">Member since {new Date().toLocaleDateString()}</p>
              <Button variant="outline" size="sm" className="mt-2">
                <Edit className="w-4 h-4 mr-2" />
                Change Avatar
              </Button>
            </div>
          </div>

          {/* Profile Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Username</label>
              <Input
                value={profileData.username}
                onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
                disabled={!isEditing}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                value={profileData.email}
                onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                disabled={!isEditing}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Full Name</label>
              <Input
                value={profileData.fullName}
                onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                disabled={!isEditing}
                placeholder="Enter your full name"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Bio</label>
              <Input
                value={profileData.bio}
                onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                disabled={!isEditing}
                placeholder="Tell us about yourself"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2">
            {isEditing ? (
              <>
                <Button onClick={handleProfileUpdate} disabled={isLoading}>
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save Changes
                </Button>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsEditing(true)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Instagram Integration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Instagram className="w-5 h-5 text-pink-600" />
            <span>Instagram Integration</span>
          </CardTitle>
          <CardDescription>
            Connect your Instagram account to enable automated messaging
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {instagramStatus.connected ? (
            <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-900">
                    Connected to @{instagramStatus.username}
                  </p>
                  <p className="text-sm text-green-700">
                    Last synced: {instagramStatus.lastSync}
                  </p>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  <Globe className="w-4 h-4 mr-2" />
                  View Account
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleInstagramDisconnect}
                  disabled={isLoading}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Disconnect
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <AlertCircle className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="font-medium text-gray-900">Instagram not connected</p>
                  <p className="text-sm text-gray-700">
                    Connect your Instagram account to start automating messages
                  </p>
                </div>
              </div>
              <Button onClick={handleInstagramConnect}>
                <Instagram className="w-4 h-4 mr-2" />
                Connect Instagram
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="w-5 h-5" />
            <span>Security</span>
          </CardTitle>
          <CardDescription>
            Manage your account security and privacy settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center space-x-3">
              <Key className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-medium text-blue-900">Two-Factor Authentication</p>
                <p className="text-sm text-blue-700">Add an extra layer of security</p>
              </div>
            </div>
            <Button variant="outline" size="sm">
              Enable 2FA
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-center space-x-3">
              <Bell className="w-5 h-5 text-orange-600" />
              <div>
                <p className="font-medium text-orange-900">Login Notifications</p>
                <p className="text-sm text-orange-700">Get notified of new login attempts</p>
              </div>
            </div>
            <Button variant="outline" size="sm">
              Configure
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Account Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-red-600">Danger Zone</CardTitle>
          <CardDescription>
            Irreversible and destructive actions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-3">
              <Trash2 className="w-5 h-5 text-red-600" />
              <div>
                <p className="font-medium text-red-900">Delete Account</p>
                <p className="text-sm text-red-700">
                  Permanently delete your account and all data
                </p>
              </div>
            </div>
            <Button variant="destructive" size="sm">
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Settings
