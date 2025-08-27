import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
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
  const navigate = useNavigate()
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
    // Load user profile and Instagram connection status
    loadUserProfile()
    loadInstagramStatus()
  }, [])

  const loadUserProfile = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/user/profile', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.profile) {
          const profile = data.profile
          setProfileData({
            username: profile.username || user.username,
            email: profile.email || user.email,
            fullName: profile.fullName || '',
            bio: profile.bio || ''
          })
        }
      }
    } catch (error) {
      console.error('Error loading user profile:', error)
    }
  }

  const loadInstagramStatus = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/instagram/status', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setInstagramStatus({
          connected: data.connected || false,
          username: data.username || '',
          lastSync: data.lastSync || null
        })
      } else {
        // If API call fails, assume not connected
        setInstagramStatus({
          connected: false,
          username: '',
          lastSync: null
        })
      }
    } catch (error) {
      console.error('Error loading Instagram status:', error)
      setInstagramStatus({
        connected: false,
        username: '',
        lastSync: null
      })
    }
  }

  const handleProfileUpdate = async () => {
    setIsLoading(true)
    
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(profileData)
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          // Update local user object
          Object.assign(user, profileData)
          setIsEditing(false)
          console.log('Profile updated successfully')
        } else {
          console.error('Failed to update profile:', data.error)
          alert('Failed to update profile. Please try again.')
        }
      } else {
        console.error('Failed to update profile:', response.status)
        alert('Failed to update profile. Please try again.')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Error updating profile. Please try again.')
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
      const token = localStorage.getItem('token')
      const response = await fetch('/api/instagram/disconnect', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        // Update local state after successful disconnect
        setInstagramStatus({
          connected: false,
          username: '',
          lastSync: null
        })
        console.log('Instagram account disconnected successfully')
      } else {
        const errorData = await response.json()
        console.error('Failed to disconnect Instagram:', errorData.error)
        alert('Failed to disconnect Instagram account. Please try again.')
      }
    } catch (error) {
      console.error('Error disconnecting Instagram:', error)
      alert('Error disconnecting Instagram account. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEnable2FA = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/user/2fa/enable', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          // Show QR code or setup instructions
          alert('2FA setup initiated. Please check your email for setup instructions.')
        } else {
          alert('Failed to enable 2FA. Please try again.')
        }
      } else {
        alert('Failed to enable 2FA. Please try again.')
      }
    } catch (error) {
      console.error('Error enabling 2FA:', error)
      alert('Error enabling 2FA. Please try again.')
    }
  }

  const handleViewInstagramAccount = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/instagram/account', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.account) {
          const account = data.account
          const accountInfo = `
Instagram Account Details:
Username: @${account.username}
Full Name: ${account.fullName || 'N/A'}
Followers: ${account.followers || 'N/A'}
Following: ${account.following || 'N/A'}
Posts: ${account.posts || 'N/A'}
Business Account: ${account.isBusinessAccount ? 'Yes' : 'No'}
          `.trim()
          alert(accountInfo)
        } else {
          alert('Failed to load Instagram account details.')
        }
      } else {
        alert('Failed to load Instagram account details.')
      }
    } catch (error) {
      console.error('Error loading Instagram account:', error)
      alert('Error loading Instagram account details.')
    }
  }

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you absolutely sure you want to delete your account? This action cannot be undone and will permanently delete all your data, flows, and Instagram connections.')) {
      return
    }

    const password = prompt('Please enter your password to confirm account deletion:')
    if (!password) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/user/delete', {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password })
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          alert('Account deleted successfully. You will be redirected to the login page.')
          // Clear local storage and redirect to login
          localStorage.clear()
          window.location.href = '/login'
        } else {
          alert('Failed to delete account: ' + (data.error || 'Unknown error'))
        }
      } else {
        alert('Failed to delete account. Please try again.')
      }
    } catch (error) {
      console.error('Error deleting account:', error)
      alert('Error deleting account. Please try again.')
    }
  }

  const handleConfigureNotifications = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/user/notifications/settings', {
        method: 'GET',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          // Show notification settings modal or navigate to settings page
          alert('Notification settings loaded. Feature coming soon!')
        } else {
          alert('Failed to load notification settings. Please try again.')
        }
      } else {
        alert('Failed to load notification settings. Please try again.')
      }
    } catch (error) {
      console.error('Error loading notification settings:', error)
      alert('Error loading notification settings. Please try again.')
    }
  }

  const handleAvatarUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    try {
      const formData = new FormData()
      formData.append('avatar', file)
      
      const token = localStorage.getItem('token')
      const response = await fetch('/api/user/avatar', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          // Refresh the page to show new avatar
          window.location.reload()
        } else {
          alert('Failed to upload avatar. Please try again.')
        }
      } else {
        alert('Failed to upload avatar. Please try again.')
      }
    } catch (error) {
      console.error('Error uploading avatar:', error)
      alert('Error uploading avatar. Please try again.')
    }
  }

  const handleInstagramConnect = () => {
    // Navigate to Instagram connection page
    navigate('/connect-instagram')
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
               <AvatarImage src={user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} />
               <AvatarFallback className="text-2xl">{user.username.charAt(0).toUpperCase()}</AvatarFallback>
             </Avatar>
            <div>
              <h3 className="text-lg font-medium">{user.username}</h3>
                             <p className="text-sm text-gray-500">Member since {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Recently'}</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={() => document.getElementById('avatar-upload').click()}
              >
                <Edit className="w-4 h-4 mr-2" />
                Change Avatar
              </Button>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
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
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleViewInstagramAccount}
                >
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
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleEnable2FA}
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                'Enable 2FA'
              )}
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
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleConfigureNotifications}
              disabled={isLoading}
            >
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
            <Button 
              variant="destructive" 
              size="sm"
              onClick={handleDeleteAccount}
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                'Delete Account'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Settings
