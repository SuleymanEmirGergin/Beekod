import { UserPlus, Mail, Shield, MoreVertical, Trash2, Edit, Crown, X, Check } from 'lucide-react';
import { useState, useEffect } from 'react';
import {
  getMembers,
  inviteMember,
  removeMember,
  updateMemberRole,
  TeamMember,
} from '../services/team';
import { SidebarV2 } from '../layouts/SidebarV2';

import { Card } from '../components/shared/';

interface TeamScreenProps {
  onNavigate: (screen: string) => void;
  userName?: string;
}

export function TeamScreen({ onNavigate }: TeamScreenProps) {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'Admin' | 'Member' | 'Viewer'>('Member');
  const [inviteSent, setInviteSent] = useState(false);
  const [showMemberMenu, setShowMemberMenu] = useState<string | null>(null);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [modalFilter, setModalFilter] = useState<'all' | 'active' | 'pending' | 'admins'>('all');
  const [showEditRoleModal, setShowEditRoleModal] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [selectedNewRole, setSelectedNewRole] = useState<'Admin' | 'Member' | 'Viewer'>('Member');
  const [loading, setLoading] = useState(true);

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

  const loadMembers = async () => {
    setLoading(true);
    const members = await getMembers();
    setTeamMembers(members);
    setLoading(false);
  };

  useEffect(() => {
    // Avoid synchronous setState warning
    requestAnimationFrame(() => {
      loadMembers();
    });
  }, []);

  const handleInvite = async () => {
    if (inviteEmail) {
      try {
        await inviteMember(inviteEmail, inviteRole);
        setInviteSent(true);
        await loadMembers();
        setTimeout(() => {
          setShowInviteModal(false);
          setInviteEmail('');
          setInviteSent(false);
        }, 1500);
      } catch (error) {
        console.error('Failed to invite member', error);
      }
    }
  };

  const handleRemoveMember = async (id: string) => {
    if (window.confirm('Are you sure you want to remove this member?')) {
      try {
        await removeMember(id);
        await loadMembers();
      } catch (error) {
        console.error('Failed to remove member', error);
      }
    }
    setShowMemberMenu(null);
  };

  const handleEditRole = (member: TeamMember) => {
    setEditingMember(member);
    const role = (['Admin', 'Member', 'Viewer'].includes(member.role) ? member.role : 'Member') as
      | 'Admin'
      | 'Member'
      | 'Viewer';
    setSelectedNewRole(role);
    setShowEditRoleModal(true);
    setShowMemberMenu(null);
  };

  const handleSaveRole = async () => {
    if (editingMember) {
      try {
        await updateMemberRole(editingMember._id, selectedNewRole);
        await loadMembers();
        setShowEditRoleModal(false);
        setEditingMember(null);
      } catch (error) {
        console.error('Failed to update role', error);
      }
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'Owner':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Admin':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Member':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'Viewer':
        return 'bg-gray-50 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  if (loading && teamMembers.length === 0) {
    return (
        <div className="flex h-screen items-center justify-center bg-gray-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <SidebarV2
        activeItem="team"
        onNavigate={onNavigate}
        userName="Ahmet Yılmaz"
        userEmail="Beekod Admin"
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <button
                onClick={() => onNavigate('dashboard')}
                className="text-[#B8934D] hover:text-[#A07D3D] hover:underline"
              >
                Ana Sayfa
              </button>
              <span>/</span>
              <span className="text-gray-900">Ekip Yönetimi</span>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowInviteModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-[#F5B800] hover:bg-[#E5A800] text-gray-900 rounded-lg text-sm transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                Üye Davet Et
              </button>
              <div className="w-9 h-9 rounded-full bg-[#F5B800] flex items-center justify-center text-sm">
                BK
              </div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto px-8 py-8">
          {/* Page header */}
          <div className="mb-8">
            <h1 className="text-3xl text-gray-900 mb-2">Ekip Yönetimi</h1>
            <p className="text-[#B8934D]">
              Ekip üyelerinizi, rollerini ve izinlerini yönetin. İşbirliği yapmak için yeni üyeler davet edin.
            </p>
          </div>

          {/* Team Stats */}
          <div className="grid grid-cols-4 gap-6 mb-8">
            <button
              onClick={() => {
                setModalFilter('all');
                setShowMembersModal(true);
              }}
              className="text-left"
            >
              <Card
                padding="lg"
                className="hover:shadow-lg hover:border-[#F5B800] transition-all cursor-pointer"
              >
                <div className="text-2xl text-gray-900 mb-1">{teamMembers.length}</div>
                <div className="text-sm text-gray-500">Toplam Üye</div>
              </Card>
            </button>
            <button
              onClick={() => {
                setModalFilter('active');
                setShowMembersModal(true);
              }}
              className="text-left"
            >
              <Card
                padding="lg"
                className="hover:shadow-lg hover:border-green-500 transition-all cursor-pointer"
              >
                <div className="text-2xl text-gray-900 mb-1">
                  {teamMembers.filter((m) => m.status === 'Active').length}
                </div>
                <div className="text-sm text-gray-500">Aktif</div>
              </Card>
            </button>
            <button
              onClick={() => {
                setModalFilter('pending');
                setShowMembersModal(true);
              }}
              className="text-left"
            >
              <Card
                padding="lg"
                className="hover:shadow-lg hover:border-orange-500 transition-all cursor-pointer"
              >
                <div className="text-2xl text-gray-900 mb-1">
                  {teamMembers.filter((m) => m.status === 'Pending').length}
                </div>
                <div className="text-sm text-gray-500">Davet Bekleyen</div>
              </Card>
            </button>
            <button
              onClick={() => {
                setModalFilter('admins');
                setShowMembersModal(true);
              }}
              className="text-left"
            >
              <Card
                padding="lg"
                className="hover:shadow-lg hover:border-purple-500 transition-all cursor-pointer"
              >
                <div className="text-2xl text-gray-900 mb-1">
                  {teamMembers.filter((m) => m.role === 'Admin' || m.role === 'Owner').length}
                </div>
                <div className="text-sm text-gray-500">Yöneticiler</div>
              </Card>
            </button>
          </div>

          {/* Team Members List */}
          <Card padding="sm">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-base text-gray-900">Ekip Üyeleri</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {teamMembers.map((member) => (
                <div key={member._id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <img
                        src={member.avatar || `https://ui-avatars.com/api/?name=${member.name}`}
                        alt={member.name}
                        className="w-12 h-12 rounded-full bg-gray-200 object-cover"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm text-gray-900">{member.name}</h3>
                          {member.role === 'Owner' && <Crown className="w-4 h-4 text-purple-600" />}
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-sm text-gray-500">{member.email}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span
                        className={`px-3 py-1 rounded-lg text-xs border ${getRoleBadgeColor(member.role)}`}
                      >
                        {member.role === 'Owner' ? 'Sahip' : member.role === 'Admin' ? 'Yönetici' : member.role === 'Viewer' ? 'İzleyici' : 'Üye'}
                      </span>
                      {member.status === 'Pending' ? (
                        <span className="px-3 py-1 bg-orange-50 text-orange-700 rounded-lg text-xs border border-orange-200">
                          Beklemede
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-green-50 text-green-700 rounded-lg text-xs border border-green-200">
                          Aktif
                        </span>
                      )}

                      {member.role !== 'Owner' && (
                        <div className="relative">
                          <button
                            onClick={() =>
                              setShowMemberMenu(showMemberMenu === member._id ? null : member._id)
                            }
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <MoreVertical className="w-4 h-4 text-gray-600" />
                          </button>

                          {showMemberMenu === member._id && (
                            <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                              <button
                                onClick={() => handleEditRole(member)}
                                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              >
                                <Edit className="w-4 h-4" />
                                Rolü Düzenle
                              </button>
                              <button
                                onClick={() => handleRemoveMember(member._id)}
                                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                                Üyeyi Sil
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Permissions Guide */}
          <Card padding="lg" className="mt-8">
            <h2 className="text-base text-gray-900 mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#F5B800]" />
              Rol İzinleri
            </h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm text-gray-900 mb-2">Sahip (Owner)</h3>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>• Tüm özelliklere tam erişim</li>
                  <li>• Faturalandırma ve abonelik yönetimi</li>
                  <li>• Üye ekleme/çıkarma yetkisi</li>
                </ul>
              </div>
              <div>
                <h3 className="text-sm text-gray-900 mb-2">Yönetici (Admin)</h3>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>• Envanter ve sipariş yönetimi</li>
                  <li>• Entegrasyonları yapılandırma</li>
                  <li>• Analiz ve raporları görüntüleme</li>
                </ul>
              </div>
              <div>
                <h3 className="text-sm text-gray-900 mb-2">Üye (Member)</h3>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>• Envanteri görüntüleme ve düzenleme</li>
                  <li>• Siparişleri işleme</li>
                  <li>• Kısıtlı ayar erişimi</li>
                </ul>
              </div>
              <div>
                <h3 className="text-sm text-gray-900 mb-2">İzleyici (Viewer)</h3>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>• Sadece okuma yetkisi</li>
                  <li>• Envanter ve siparişleri görüntüleme</li>
                  <li>• Düzenleme yetkisi yok</li>
                </ul>
              </div>
            </div>
          </Card>
        </main>
      </div>

      {/* Floating Chat Button */}
      

      {/* Members Detail Modal */}
      {showMembersModal &&
        (() => {
          const getModalTitle = () => {
            switch (modalFilter) {
              case 'all':
                return 'Tüm Ekip Üyeleri';
              case 'active':
                return 'Aktif Üyeler';
              case 'pending':
                return 'Bekleyen Davetler';
              case 'admins':
                return 'Yöneticiler';
              default:
                return 'Ekip Üyeleri';
            }
          };

          const getFilteredMembers = () => {
            switch (modalFilter) {
              case 'active':
                return teamMembers.filter((m) => m.status === 'Active');
              case 'pending':
                return teamMembers.filter((m) => m.status === 'Pending');
              case 'admins':
                return teamMembers.filter((m) => m.role === 'Admin' || m.role === 'Owner');
              case 'all':
              default:
                return teamMembers;
            }
          };

          const filteredMembers = getFilteredMembers();

          return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                  <div>
                    <h2 className="text-lg text-gray-900">{getModalTitle()}</h2>
                    <p className="text-xs text-gray-500">
                      {filteredMembers.length} üye
                    </p>
                  </div>
                  <button
                    onClick={() => setShowMembersModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                  <div className="space-y-3">
                    {filteredMembers.map((member) => (
                      <div
                        key={member._id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <img
                            src={member.avatar || `https://ui-avatars.com/api/?name=${member.name}`}
                            alt={member.name}
                            className="w-10 h-10 rounded-full bg-gray-200 object-cover"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm text-gray-900">{member.name}</h3>
                              {member.role === 'Owner' && (
                                <Crown className="w-3.5 h-3.5 text-purple-600" />
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <Mail className="w-3 h-3 text-gray-400" />
                              <span className="text-xs text-gray-500">{member.email}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2.5 py-1 rounded-lg text-xs border ${getRoleBadgeColor(member.role)}`}
                          >
                            {member.role === 'Owner' ? 'Sahip' : member.role === 'Admin' ? 'Yönetici' : member.role === 'Viewer' ? 'İzleyici' : 'Üye'}
                          </span>
                          {member.status === 'Pending' ? (
                            <span className="px-2.5 py-1 bg-orange-50 text-orange-700 rounded-lg text-xs border border-orange-200">
                              Beklemede
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 bg-green-50 text-green-700 rounded-lg text-xs border border-green-200">
                              Aktif
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

      {/* Invite Member Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div>
                <h2 className="text-lg text-gray-900">Ekip Üyesi Davet Et</h2>
                <p className="text-xs text-gray-500">Ekibinize katılmaları için bir davet gönderin</p>
              </div>
              <button
                onClick={() => {
                  setShowInviteModal(false);
                  setInviteSent(false);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6">
              {inviteSent ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-base text-gray-900 mb-2">Davet Gönderildi!</h3>
                  <p className="text-sm text-gray-600">{inviteEmail} adresine davet gönderdik.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">E-posta Adresi</label>
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="ekip.arkadasi@sirket.com"
                      className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#F5B800]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-700 mb-2">Rol</label>
                    <select
                      value={inviteRole}
                      onChange={(e) =>
                        setInviteRole(e.target.value as 'Admin' | 'Member' | 'Viewer')
                      }
                      className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-[#F5B800]"
                    >
                      <option value="Admin">Yönetici (Admin)</option>
                      <option value="Member">Üye (Member)</option>
                      <option value="Viewer">İzleyici (Viewer)</option>
                    </select>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => setShowInviteModal(false)}
                      className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors"
                    >
                      İptal
                    </button>
                    <button
                      onClick={handleInvite}
                      disabled={!inviteEmail}
                      className="flex-1 px-4 py-2.5 bg-[#F5B800] hover:bg-[#E5A800] text-gray-900 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <Mail className="w-4 h-4" />
                      Davet Gönder
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Role Modal */}
      {showEditRoleModal && editingMember && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div>
                <h2 className="text-lg text-gray-900">Rolü Düzenle</h2>
                <p className="text-xs text-gray-500">{editingMember.name} için rolü değiştir</p>
              </div>
              <button
                onClick={() => setShowEditRoleModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Rol</label>
                  <select
                    value={selectedNewRole}
                    onChange={(e) =>
                      setSelectedNewRole(e.target.value as 'Admin' | 'Member' | 'Viewer')
                    }
                    className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-[#F5B800]"
                  >
                    <option value="Admin">Yönetici (Admin)</option>
                    <option value="Member">Üye (Member)</option>
                    <option value="Viewer">İzleyici (Viewer)</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowEditRoleModal(false)}
                    className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors"
                  >
                    İptal
                  </button>
                  <button
                    onClick={handleSaveRole}
                    className="flex-1 px-4 py-2.5 bg-[#F5B800] hover:bg-[#E5A800] text-gray-900 rounded-lg text-sm transition-colors"
                  >
                    Kaydet
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
