import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ALL_QUICK_ACTIONS, QuickAction } from '@/config/quickActions';
import { useAuth } from '@/contexts/AuthContext';

const QuickActions = () => {
  const { profile } = useAuth();

  const defaultActions = ['new_plan', 'new_evaluation', 'manage_courses'];
  const actionIds = profile?.quick_actions_prefs && profile.quick_actions_prefs.length > 0 
    ? profile.quick_actions_prefs 
    : defaultActions;

  const actionsToRender = actionIds
    .map(id => ALL_QUICK_ACTIONS.find(action => action.id === id))
    .filter((action): action is QuickAction => !!action);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" data-tour="quick-actions">
      {actionsToRender.map(action => (
        <Button asChild size="lg" className="h-20 text-lg" key={action.id}>
          <Link to={action.path}>
            <action.icon className="mr-2" /> {action.label}
          </Link>
        </Button>
      ))}
    </div>
  );
};

export default QuickActions;